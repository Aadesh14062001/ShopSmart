using System;
using System.Collections.Generic;

namespace shopsmart.Model.Entities;

public partial class User
{
    public int Id { get; set; }

    public string? GoogleId { get; set; }

    public string Name { get; set; } = null!;

    public string Email { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public string? PasswordHash { get; set; }

    public string Role { get; set; } = null!;
}
