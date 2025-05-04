require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

// Cấu hình middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Thêm route để kiểm tra server
app.get('/', (req, res) => {
    res.send('API đang hoạt động!');
});

app.post('/generate-question', async (req, res) => {
    try {
        // Kiểm tra body request
        if (!req.body || !req.body.topic || !req.body.level) {
            return res.status(400).json({
                error: 'Thiếu thông tin topic hoặc level',
                received: req.body
            });
        }

        const { topic, level } = req.body;
        console.log('Nhận yêu cầu tạo câu hỏi:', { topic, level });

        const prompt = `
Tạo một câu hỏi trắc nghiệm tiếng Anh lớp 11 theo định dạng JSON sau:

{
  "question": "Câu hỏi bằng tiếng Anh",
  "options": [
    "A. Lựa chọn A",
    "B. Lựa chọn B", 
    "C. Lựa chọn C",
    "D. Lựa chọn D"
  ],
  "answer": "A"
}

Yêu cầu:
1. Chủ đề: ${topic}
2. Mức độ: ${level}
3. Chỉ trả về JSON, không có text nào khác
4. Đảm bảo JSON hợp lệ và có đúng 4 lựa chọn
5. Đáp án phải là một trong các chữ cái A, B, C, D
6. Mỗi lựa chọn phải bắt đầu bằng chữ cái tương ứng (A., B., C., D.)
7. Không được có dấu phẩy ở cuối mảng options
8. Câu hỏi phải liên quan đến chủ đề ${topic}
9. Mức độ khó phải phù hợp với ${level}
10. Đảm bảo JSON không có lỗi cú pháp
11. Không được có dấu ngoặc kép thừa trong JSON
12. Đảm bảo mỗi lựa chọn có đúng định dạng "A. Nội dung", "B. Nội dung", v.v.
13. Đảm bảo câu hỏi và các lựa chọn đều bằng tiếng Anh
14. Đảm bảo đáp án là một trong các lựa chọn A, B, C, D
15. Không được có dấu phẩy ở cuối mảng options
16. Không được có dấu phẩy sau đáp án
17. Không được có khoảng trắng thừa trong JSON
18. Đảm bảo mỗi lựa chọn có đúng định dạng "A. Nội dung", "B. Nội dung", v.v.
19. Đảm bảo câu hỏi và các lựa chọn đều bằng tiếng Anh
20. Đảm bảo đáp án là một trong các lựa chọn A, B, C, D 
21. Các đáp án không được giống nhau.
`;

        console.log('Gửi yêu cầu đến Ollama API...');

        // Sử dụng API của Ollama
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: "gemma3",
            prompt: prompt,
            stream: false,
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40
        });

        console.log('Nhận phản hồi từ Ollama API');

        try {
            const content = response.data.response;
            console.log('Nội dung phản hồi:', content);

            // Xóa các ký tự không cần thiết
            const cleanContent = content.replace(/```json\n|\n```/g, '').trim();

            // Parse JSON
            const json = JSON.parse(cleanContent);
            console.log('JSON đã parse:', json);

            // Kiểm tra cấu trúc cơ bản
            if (!json.question || !json.options || !json.answer) {
                throw new Error('Thiếu question, options hoặc answer');
            }

            // Kiểm tra số lượng lựa chọn
            if (!Array.isArray(json.options) || json.options.length !== 4) {
                throw new Error('Phải có đúng 4 lựa chọn');
            }

            // Kiểm tra định dạng các lựa chọn
            const validOptions = json.options.every((option, index) => {
                const letter = String.fromCharCode(65 + index); // A, B, C, D
                return option.startsWith(`${letter}.`);
            });

            if (!validOptions) {
                throw new Error('Các lựa chọn phải bắt đầu bằng A., B., C., D.');
            }

            // Kiểm tra đáp án
            if (!['A', 'B', 'C', 'D'].includes(json.answer)) {
                throw new Error('Đáp án phải là A, B, C hoặc D');
            }

            console.log('Câu hỏi hợp lệ, gửi phản hồi');
            res.json(json);
        } catch (error) {
            console.error('❌ Lỗi khi xử lý câu hỏi:', error.message);
            console.error('Nội dung gây lỗi:', response.data.response);
            res.status(500).json({
                error: 'Không thể tạo câu hỏi',
                details: error.message,
                content: response.data.response
            });
        }
    } catch (error) {
        console.error('❌ Lỗi khi gọi API:', error.message);
        res.status(500).json({
            error: 'Lỗi hệ thống',
            details: error.message
        });
    }
});

// Lắng nghe trên tất cả các interface
app.listen(port, '0.0.0.0', () => {
    console.log(`✅ API AI đang chạy tại:`);
    console.log(`- http://localhost:${port}`);
    console.log(`- http://192.168.1.5:${port}`);
    console.log(`- http://[your-ip-address]:${port}`);
});
