using System;
using System.Collections.Generic;

namespace shopsmart.Model.Entities;

public partial class Product
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public string? ImageUrl { get; set; }

    public string? Category { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? SubCategory { get; set; }

    public int? CategoryId { get; set; }

    public decimal? Mrp { get; set; }

    public virtual Category? CategoryNavigation { get; set; }
}
