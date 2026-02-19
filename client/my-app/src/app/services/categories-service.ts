import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CategoryDto, CreateCategoryDto } from '../models/category';
@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  AUTH_URL = 'http://localhost:5062/api/Category';

  constructor(private http: HttpClient) { }

  getAllCategories(): Observable<CategoryDto[]> {
    const token = localStorage.getItem('token');
    return this.http.get<CategoryDto[]>
      (`${this.AUTH_URL}/GetAllCategories`,
        { headers: { Authorization: `Bearer ${token}` } })
  }


  addCategory(dto: CreateCategoryDto): Observable<string> {
    const token = localStorage.getItem('token');
    return this.http.post(
      `${this.AUTH_URL}/AddCategory`,
      dto,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text'
      }
    );
  }


  deleteCategory(id: number): Observable<string> {
    const token = localStorage.getItem('token');
    return this.http.delete(`${this.AUTH_URL}/DeleteCategory/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }

  updateCategory(dto: CategoryDto): Observable<string> {
    const token = localStorage.getItem('token');
    return this.http.put(`${this.AUTH_URL}/UpdateCategory`, dto, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }

}
