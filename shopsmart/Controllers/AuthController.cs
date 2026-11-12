
using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using shopsmart.Model.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Identity;

namespace shopsmart.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ShopsmartContext _context;
        private readonly IPasswordHasher<User> _passwordHasher;


        public AuthController(
      IConfiguration configuration,
      ShopsmartContext context,
      IPasswordHasher<User> passwordHasher)
        {
            _configuration = configuration;
            _context = context;
            _passwordHasher = passwordHasher;
        }



        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Name, email, and password are required." });
            }

            if (request.Password.Length < 8)
            {
                return BadRequest(new { message = "Password must be at least 8 characters." });
            }

            var email = request.Email.Trim().ToLowerInvariant();

            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == email);

            if (emailExists)
            {
                return Conflict(new { message = "An account with this email already exists. Please log in." });
            }

            var user = new User
            {
                Name = request.Name.Trim(),
                Email = email,
                GoogleId = null,
                CreatedAt = DateTime.UtcNow,
                Role = "Customer"
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Registration successful. You can now log in.",
                userId = user.Id
            });
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Email and password are required."
                });
            }

            var email = request.Email.Trim().ToLowerInvariant();

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            // Use the same message for invalid email and password.
            if (user == null || string.IsNullOrEmpty(user.PasswordHash))
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            var passwordResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password
            );

            if (passwordResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            // Upgrade the stored hash if the hasher's format has changed.
            if (passwordResult == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswordHash = _passwordHasher.HashPassword(
                    user,
                    request.Password
                );

                await _context.SaveChangesAsync();
            }

            var token = GenerateJwtToken(user);

            Response.Cookies.Append("shopsmart_session", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // Local HTTP development only; use true with HTTPS in production.
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddMinutes(
                    int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var minutes)
                        ? minutes
                        : 60),
                IsEssential = true
            });

            return Ok(new
            {
                message = "Login successful.",
                userId = user.Id,
                name = user.Name,
                email = user.Email
            });
        }


        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin(
            [FromBody] GoogleLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.IdToken))
                return BadRequest(new { message = "Google ID token is required." });

            var clientId = _configuration["GoogleAuth:ClientId"];

            if (string.IsNullOrWhiteSpace(clientId))
                return StatusCode(500, new { message = "Google authentication is not configured." });

            GoogleJsonWebSignature.Payload payload;

            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(
                    request.IdToken,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { clientId }
                    });
            }
            catch (InvalidJwtException)
            {
                return Unauthorized(new { message = "Invalid Google ID token." });
            }

            if (string.IsNullOrWhiteSpace(payload.Subject) ||
                string.IsNullOrWhiteSpace(payload.Email))
            {
                return Unauthorized(new { message = "Google account information is incomplete." });
            }

            if (payload.EmailVerified != true)
                return Unauthorized(new { message = "Google email is not verified." });

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);

            if (user == null)
            {
                // Do not silently link an existing email to a different Google account.
                var emailExists = await _context.Users
                    .AnyAsync(u => u.Email == payload.Email);

                if (emailExists)
                    return Conflict(new
                    {
                        message = "This email is already registered with another login method."
                    });

                user = new User
                {
                    GoogleId = payload.Subject,
                    Name = payload.Name ?? string.Empty,
                    Email = payload.Email,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            else
            {
                user.Name = payload.Name ?? user.Name;
                user.Email = payload.Email;
                await _context.SaveChangesAsync();
            }


            var token = GenerateJwtToken(user);

            Response.Cookies.Append("shopsmart_session", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // Local HTTP development only; use true with HTTPS in production.
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddMinutes(
                    int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var minutes)
                        ? minutes
                        : 60),
                IsEssential = true
            });

            return Ok(new
            {
                message = "Google login successful.",
                userId = user.Id,
                name = user.Name,
                email = user.Email
            });

        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("shopsmart_session", new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Lax
            });

            return Ok(new { message = "Logged out successfully." });
        }


        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key is missing.");

            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            var claims = new[]
            {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.Name),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Role)
    };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey));

            var credentials = new SigningCredentials(
                key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var minutes)
                        ? minutes
                        : 60),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }


        [Microsoft.AspNetCore.Authorization.Authorize]
        [HttpGet("me")]
        public IActionResult GetCurrentUser()
        {
            return Ok(new
            {
                userId = User.FindFirst(
                    System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
                name = User.Identity?.Name,
                email = User.FindFirst(
                    System.Security.Claims.ClaimTypes.Email)?.Value,
                role = User.FindFirst(ClaimTypes.Role)?.Value
            });
        }


    }


    public class GoogleLoginRequest
    {
        public string IdToken { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
