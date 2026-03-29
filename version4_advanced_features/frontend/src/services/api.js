/**
 * api.js - Tầng Giao tiếp API - Version 4
 * ========================================
 * Hỗ trợ:
 * - JWT Token
 * - Filtering Category, Difficulty & Limit.
 */

const API_BASE_URL = "http://localhost:8000";

const getAuthHeaders = () => {
  // [RBAC Context]: Lấy token từ localStorage để chứng thực người dùng.
  // [No-Auth Modification]: Trả về object rỗng {} nếu không muốn dùng header Authorization.
  const token = localStorage.getItem("token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export const apiService = {
  // --- AUTH ---
  
  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Đăng nhập thất bại");
    }

    const data = await response.json();
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("username", username);
    return data;
  },

  async register(username, password) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Đăng ký thất bại");
    }

    return response.json();
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
  },

  isAuthenticated() {
    return !!localStorage.getItem("token");
  },

  getUserRole() {
    return localStorage.getItem("role");
  },

  // --- PLAYER ROUTES ---
  
  async getQuestions(category = '', difficulty = '', limit = null) {
    // [RBAC Context]: Token được gửi kèm header qua 'getAuthHeaders' để backend biết user là ai.
    // [No-Auth Modification]: Chỉ cần giữ URL fetch cơ bản, không cần quan tâm đến headers.
    let url = `${API_BASE_URL}/questions?`;
    if (category) url += `category=${encodeURIComponent(category)}&`;
    if (difficulty) url += `difficulty=${encodeURIComponent(difficulty)}&`;
    if (limit) url += `limit=${limit}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (response.status === 401) throw new Error("Unauthorized");
    return response.json();
  },

  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async submitQuiz(answers) {
    const response = await fetch(`${API_BASE_URL}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ answers }),
    });
    if (response.status === 401) throw new Error("Unauthorized");
    return response.json();
  },

  // --- ADMIN ROUTES ---

  async adminGetAllQuestions(category = '', difficulty = '') {
    const response = await fetch(`${API_BASE_URL}/admin/questions`, {
      headers: getAuthHeaders(),
    });
    if (response.status === 403) throw new Error("Forbidden");
    return response.json();
  },

  async createQuestion(questionData) {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(questionData),
    });
    return response.json();
  },

  async updateQuestion(id, questionData) {
    const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(questionData),
    });
    return response.json();
  },

  async deleteQuestion(id) {
    const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.json();
  }
};
