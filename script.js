async function fetchAIQuestion(topic, level) {
    try {
        console.log('Gửi yêu cầu tạo câu hỏi:', { topic, level });
        
        const res = await fetch('http://192.168.1.5:3000/generate-question', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                topic: topic,
                level: level
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('Lỗi từ server:', errorData);
            throw new Error(errorData.error || 'Không thể tạo câu hỏi');
        }

        const data = await res.json();
        console.log('Dữ liệu nhận được từ API:', data);

        if (!data.question || !data.options || !data.answer) {
            throw new Error('Dữ liệu câu hỏi không hợp lệ');
        }

        return {
            category: topic,
            level: level,
            points: getPointsByLevel(level),
            question: data.question,
            options: data.options,
            answer: data.answer
        };
    } catch (error) {
        console.error('Lỗi khi lấy câu hỏi:', error);
        throw error;
    }
}

function getPointsByLevel(level) {
    switch (level) {
        case "Nhận biết": return 1;
        case "Thông hiểu": return 1;
        case "Vận dụng": return 2;
        case "Vận dụng cao": return 3;
        default: return 1;
    }
}

// Các biến để theo dõi tiến trình câu hỏi
let currentQuestionIndex = 0;
let score = 0;
let questions = []; // Mảng chứa tất cả câu hỏi
let totalQuestions = 1; // Chỉ tạo 1 câu hỏi mỗi lần
let selectedTopic = null;
let selectedLevel = null;

// Các phần tử DOM
const welcomeScreen = document.querySelector('.welcome-screen');
const questionScreen = document.querySelector('.question-screen');
const resultScreen = document.querySelector('.result-screen');
const loadingScreen = document.querySelector('.loading-screen');
const startButton = document.querySelector('.start-btn');
const nextButton = document.querySelector('.next-btn');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const currentQuestionElement = document.getElementById('current-question');
const totalQuestionsElement = document.getElementById('total-questions');
const questionPointsElement = document.getElementById('question-points');
const questionLevelElement = document.getElementById('question-level');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.querySelector('.restart-btn');

// Xử lý sự kiện chọn chủ đề
document.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Bỏ chọn tất cả các nút chủ đề
        document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('selected'));
        // Chọn nút được click
        btn.classList.add('selected');
        selectedTopic = btn.dataset.topic;
        console.log('Đã chọn chủ đề:', selectedTopic);
    });
});

// Xử lý sự kiện chọn mức độ
document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Bỏ chọn tất cả các nút mức độ
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
        // Chọn nút được click
        btn.classList.add('selected');
        selectedLevel = btn.dataset.level;
        console.log('Đã chọn mức độ:', selectedLevel);
    });
});

// Hàm bắt đầu bài kiểm tra
async function startQuiz() {
    if (!selectedTopic || !selectedLevel) {
        alert('Vui lòng chọn chủ đề và mức độ trước khi bắt đầu!');
        return;
    }

    console.log('Bắt đầu bài kiểm tra với:');
    console.log('- Chủ đề:', selectedTopic);
    console.log('- Mức độ:', selectedLevel);

    // Ẩn màn hình chào mừng và hiển thị màn hình loading
    welcomeScreen.classList.remove('active');
    loadingScreen.classList.add('active');
    
    // Reset các biến
    currentQuestionIndex = 0;
    score = 0;
    questions = [];
    
    try {
        console.log('Đang lấy câu hỏi...');
        const q = await fetchAIQuestion(selectedTopic, selectedLevel);
        questions.push(q);
        console.log('Đã thêm câu hỏi:', q);
        
        // Ẩn màn hình loading và hiển thị màn hình câu hỏi
        loadingScreen.classList.remove('active');
        questionScreen.classList.add('active');
        
        // Hiển thị câu hỏi đầu tiên
        if (questions.length > 0) {
            loadNextQuestion();
        }
    } catch (e) {
        console.error("❌ Không tạo được câu hỏi:", e);
        // Ẩn màn hình loading và hiển thị thông báo lỗi
        loadingScreen.classList.remove('active');
        welcomeScreen.classList.add('active');
        alert("Không thể tạo câu hỏi. Vui lòng thử lại.");
    }
}

// Hàm để tải câu hỏi tiếp theo
function loadNextQuestion() {
    console.log("Đang tải câu hỏi:", currentQuestionIndex);
    console.log("Danh sách câu hỏi:", questions);
    
    if (currentQuestionIndex >= totalQuestions) {
        showResults();
        return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
        console.error("❌ Không có câu hỏi tại index:", currentQuestionIndex);
        return;
    }

    console.log("Câu hỏi hiện tại:", currentQuestion);

    // Cập nhật số câu hỏi
    currentQuestionElement.textContent = currentQuestionIndex + 1;
    totalQuestionsElement.textContent = totalQuestions;
    
    // Hiển thị câu hỏi
    questionText.innerHTML = `
        <div class="question-category">Chủ đề: ${currentQuestion.category}</div>
        <div class="question-level">Mức độ: ${currentQuestion.level}</div>
        <p class="question-text">${currentQuestion.question}</p>
    `;

    // Xóa các lựa chọn cũ
    optionsContainer.innerHTML = '';

    // Tạo các lựa chọn mới
    currentQuestion.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('option');
        optionElement.classList.add('option-unselected');
        
        // Tách chữ cái và nội dung
        const [letter, ...content] = option.split('.');
        const optionContent = content.join('.').trim();
        
        optionElement.innerHTML = `
            <span class="option-letter">${letter}</span>
            <span class="option-text">${optionContent}</span>
        `;

        optionElement.addEventListener('click', () => {
            // Bỏ chọn tất cả các lựa chọn khác
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('option-selected');
                opt.classList.add('option-unselected');
            });
            
            // Chọn lựa chọn hiện tại
            optionElement.classList.remove('option-unselected');
            optionElement.classList.add('option-selected');
            
            // Xử lý câu trả lời
            handleAnswer(letter.trim(), currentQuestion.answer);
        });

        optionsContainer.appendChild(optionElement);
    });

    // Cập nhật mức độ và điểm
    questionLevelElement.textContent = currentQuestion.level;
    questionPointsElement.textContent = currentQuestion.points;

    // Vô hiệu hóa nút Next cho đến khi chọn câu trả lời
    nextButton.disabled = true;

    // Cập nhật progress bar
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    document.querySelector('.progress-bar').style.width = `${progress}%`;

    // Tăng chỉ số câu hỏi
    currentQuestionIndex++;
}

// Hàm xử lý khi người dùng chọn câu trả lời
function handleAnswer(selectedAnswer, correctAnswer) {
    // Lưu điểm nếu đúng
    if (selectedAnswer === correctAnswer) {
        score += parseInt(questionPointsElement.textContent);
    }

    // Hiển thị nút Next
    nextButton.disabled = false;
}

// Hàm hiển thị kết quả sau khi hoàn thành bài kiểm tra
function showResults() {
    questionScreen.classList.remove('active');
    resultScreen.classList.add('active');
    finalScoreElement.textContent = `${score}/${totalQuestions}`;
}

// Xử lý sự kiện khi nhấn nút bắt đầu
startButton.addEventListener('click', startQuiz);

// Xử lý sự kiện khi nhấn nút Next
nextButton.addEventListener('click', () => {
    loadNextQuestion();
});

// Xử lý sự kiện khi nhấn nút làm lại
restartButton.addEventListener('click', () => {
    resultScreen.classList.remove('active');
    welcomeScreen.classList.add('active');
    // Reset các lựa chọn
    document.querySelectorAll('.topic-btn, .level-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    selectedTopic = null;
    selectedLevel = null;
});
