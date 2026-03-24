/**
 * api.js - Tầng API Service
 * ==========================
 * Xử lý giao tiếp giữa Frontend và Backend thông qua HTTP requests.
 * Sử dụng fetch API (có sẵn trong trình duyệt, không cần cài thêm thư viện).
 *
 * Cách sửa đổi:
 * - Đổi URL backend: thay đổi biến BASE_URL bên dưới
 * - Thêm API mới: tạo hàm mới theo mẫu fetchQuestions() hoặc submitAnswers()
 * - Thêm authentication: thêm header Authorization vào các request
 * - Xử lý lỗi nâng cao: thêm try-catch và hiển thị thông báo chi tiết
 */

// URL gốc của Backend API
// Thay đổi URL này khi deploy lên server thật (ví dụ: "https://api.example.com")
const BASE_URL = "http://localhost:8000";

/**
 * Lấy danh sách câu hỏi từ Backend.
 *
 * Gọi endpoint: GET /questions
 * Trả về: mảng các câu hỏi (KHÔNG có đáp án đúng)
 *
 * Cách hoạt động:
 * 1. Gửi GET request đến Backend
 * 2. Kiểm tra response có thành công không
 * 3. Parse JSON và trả về dữ liệu
 *
 * Cách sửa đổi:
 * - Thêm tham số lọc: fetchQuestions(category) và thêm query string ?category=...
 * - Thêm loading state: gọi hàm callback trước và sau khi fetch
 */
export async function fetchQuestions() {
    // Gửi GET request đến endpoint /questions
    const response = await fetch(`${BASE_URL}/questions`);

    // Kiểm tra nếu request thất bại (status code không phải 2xx)
    if (!response.ok) {
        throw new Error("Không thể tải câu hỏi. Vui lòng thử lại!");
    }

    // Parse response body từ JSON thành JavaScript object
    const data = await response.json();
    return data;
}

/**
 * Gửi câu trả lời và nhận kết quả chấm điểm.
 *
 * Gọi endpoint: POST /submit
 * Tham số: answers - mảng các { question_id, selected_answer }
 * Trả về: kết quả gồm score, total, và details
 *
 * Cách hoạt động:
 * 1. Đóng gói answers thành JSON
 * 2. Gửi POST request với body là JSON
 * 3. Parse và trả về kết quả
 *
 * Cách sửa đổi:
 * - Gửi thêm thông tin: thêm trường vào body (ví dụ: time_taken)
 * - Retry khi lỗi: bọc trong vòng lặp với số lần retry tối đa
 */
export async function submitAnswers(answers) {
    // Gửi POST request với body chứa danh sách câu trả lời
    const response = await fetch(`${BASE_URL}/submit`, {
        method: "POST",
        headers: {
            // Báo cho server biết body là JSON
            "Content-Type": "application/json",
        },
        // Chuyển đổi JavaScript object thành chuỗi JSON
        body: JSON.stringify({ answers }),
    });

    // Kiểm tra nếu request thất bại
    if (!response.ok) {
        throw new Error("Không thể nộp bài. Vui lòng thử lại!");
    }

    // Parse và trả về kết quả
    const data = await response.json();
    return data;
}
