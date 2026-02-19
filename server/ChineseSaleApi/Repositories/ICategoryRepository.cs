using ChineseSaleApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ChineseSaleApi.Repositories
{
    public interface ICategoryRepository
    {
        public Task<List<Category>> GetAllCategoriesAsync();
        public Task AddCategoryAsync(Category category);
        public Task<bool> CategoryIsExistAsync(string name);
        public Task DeleteCategoryAsync(int id);

        public Task UpdateCategoryAsync(Category category);



    }
}
