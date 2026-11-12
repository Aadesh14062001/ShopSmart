using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using shopsmart.Model.Entities;
public record CategoryDto(
    int Id,
    string Name,
    string? ImageUrl,
    List<CategoryDto> Children);

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ShopsmartContext _db;

    public CategoriesController(ShopsmartContext db) => _db = db;

    // GET /api/Categories  ->  main categories, each with its sub categories
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        var all = await _db.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync();

        var tree = all
            .Where(c => c.ParentId == null)
            .Select(main => new CategoryDto(
                main.Id,
                main.Name,
                main.ImageUrl,
                all.Where(sub => sub.ParentId == main.Id)
                   .Select(sub => new CategoryDto(sub.Id, sub.Name, sub.ImageUrl, new()))
                   .ToList()))
            .ToList();

        return tree;
    }
}