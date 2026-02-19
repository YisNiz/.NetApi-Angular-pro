using ChineseSaleApi.Dto;

namespace ChineseSaleApi.Services
{
    public interface ICategoryService
    {
        public Task<List<CategoryDto>> GetAllCategoriesAsync();
        public Task AddCategoryAsync(CreateCategoryDto categoryDto);
        public Task DeleteCategoryAsync(int id);
        public Task UpdateCategoryAsync(CategoryDto categoryDto);




    }
}
