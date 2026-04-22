/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PROJECT: STUDY GOAL TRACKER (학습 목표 추적기)
 * DESCRIPTION: A mini-project demonstrating modern React practices, local storage data persistence, 
 * compound state management (history, daily goals), animations using Framer Motion, and Tailwind CSS UI.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ChevronLeft, ChevronRight, CheckCircle2, Target, CalendarDays, X, Trash2 } from 'lucide-react';

// --- TYPES & INTERFACES ---
interface Goal {
  id: string;
  text: string;
  completed: boolean;
  progress: number; // 0 - 100
}

interface HistoryData {
  [dateString: string]: Goal[];
}

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

// --- UTILITIES ---
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplayName = (dateStr: string) => {
  if (dateStr === getTodayString()) return '오늘 (Hôm nay)';
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${m}월 ${d}일`;
};

// --- MAIN COMPONENT ---
export default function App() {
  // --- 1. STATE MANAGEMENT ---
  const today = getTodayString();
  const [currentDate, setCurrentDate] = useState<string>(today);
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<HistoryData>({});
  const [hasCheckedIn, setHasCheckedIn] = useState<boolean>(true); // start true, verify in effect
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- 2. LIFECYCLE & STORAGE ---
  // Load dữ liệu khi vừa mở trang (Khởi tạo)
  useEffect(() => {
    const savedHistory = localStorage.getItem('studyTrackerHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    
    // Kiểm tra đã check-in ngày hôm nay chưa
    const lastCheckIn = localStorage.getItem('studyTrackerLastCheckIn');
    if (lastCheckIn !== today) {
      setHasCheckedIn(false);
    }
    
    setIsLoaded(true);
  }, [today]);

  // Tự động lưu `history` mỗi khi có thay đổi
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('studyTrackerHistory', JSON.stringify(history));
    }
  }, [history, isLoaded]);

  // --- 3. ACTIONS & LOGIC ---
  const currentGoals = history[currentDate] || [];

  // Hàm hiển thị thông báo Toast góc màn hình
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Xác nhận Check-in
  const handleCheckIn = () => {
    localStorage.setItem('studyTrackerLastCheckIn', today);
    setHasCheckedIn(true);
    showToast('🎉 출석 완료! (Check-in thành công!)', 'success');
  };

  // Đổi ngày trong lịch sử
  const changeDate = (offset: number) => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + offset);
    const newD = String(dateObj.getDate()).padStart(2, '0');
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newY = dateObj.getFullYear();
    setCurrentDate(`${newY}-${newM}-${newD}`);
  };

  // Thêm mục tiêu
  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newGoal: Goal = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      completed: false,
      progress: 0,
    };

    setHistory(prev => ({
      ...prev,
      [currentDate]: [...(prev[currentDate] || []), newGoal]
    }));
    
    setInputValue('');
    showToast('목표가 추가되었습니다 (Đã thêm mục tiêu)', 'info');
  };

  // Cập nhật thanh tiến độ cá nhân của từng mục tiêu (kéo thanh slider)
  const updateGoalProgress = (id: string, newProgress: number) => {
    let justCompleted = false;
    setHistory(prev => {
      const dayGoals = prev[currentDate] || [];
      const updated = dayGoals.map(g => {
        if (g.id === id) {
          const completed = newProgress === 100;
          if (completed && !g.completed) justCompleted = true;
          return { ...g, progress: newProgress, completed };
        }
        return g;
      });
      return { ...prev, [currentDate]: updated };
    });
    
    if (justCompleted) showToast('달성 완료! (Hoàn thành xuất sắc!)', 'success');
  };

  // Đánh dấu check hoàn thành nhanh
  const toggleGoal = (id: string) => {
    let justCompleted = false;
    setHistory(prev => {
      const dayGoals = prev[currentDate] || [];
      const updated = dayGoals.map(g => {
        if (g.id === id) {
          const newCompleted = !g.completed;
          if (newCompleted) justCompleted = true;
          return { ...g, completed: newCompleted, progress: newCompleted ? 100 : 0 };
        }
        return g;
      });
      return { ...prev, [currentDate]: updated };
    });

    if (justCompleted) showToast('달성 완료! (Hoàn thành xuất sắc!)', 'success');
  };

  // Xóa mục tiêu
  const deleteGoal = (id: string) => {
    setHistory(prev => ({
      ...prev,
      [currentDate]: (prev[currentDate] || []).filter(g => g.id !== id)
    }));
    showToast('삭제되었습니다 (Đã xóa mục tiêu)', 'error');
  };

  // --- 4. COMPUTED VALUES ---
  const completedCount = currentGoals.filter(g => g.completed).length;
  const overallProgress = currentGoals.length === 0 ? 0 : Math.round((completedCount / currentGoals.length) * 100);

  // Tránh lỗi hydration trong react
  if (!isLoaded) return null; 

  // --- 5. RENDER (GIAO DIỆN) ---
  return (
    <div className="min-h-screen bg-indigo-50/50 flex items-center justify-center p-4 sm:p-8 font-sans text-neutral-800 relative xl:text-base">
      
      {/* 1. MÀN HÌNH CHECK-IN (Modal) */}
      <AnimatePresence>
        {!hasCheckedIn && currentDate === today && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">새로운 하루네요!</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">Hôm nay bạn đã sẵn sàng học tập chưa?<br/>Hãy điểm danh để bắt đầu nhé!</p>
              <button
                onClick={handleCheckIn}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-lg shadow-indigo-200"
              >
                오늘의 출석 (Check-in)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. HỆ THỐNG THÔNG BÁO (Toast) */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`px-4 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md font-medium text-sm pointer-events-auto
                ${toast.type === 'success' ? 'bg-green-50/95 text-green-700 border-green-200' : 
                  toast.type === 'error' ? 'bg-red-50/95 text-red-700 border-red-200' : 
                  'bg-white/95 text-blue-700 border-blue-200'}`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
              {toast.type === 'info' && <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />}
              {toast.type === 'error' && <Trash2 className="w-5 h-5 flex-shrink-0" />}
              <span className="mt-0.5">{toast.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 3. KHUNG ỨNG DỤNG CHÍNH */}
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-indigo-100/50 border border-indigo-50 overflow-hidden relative z-10 flex flex-col h-[85vh] xl:max-h-[850px]">
        
        {/* HEADER AREA */}
        <div className="p-6 sm:p-8 pb-5 bg-white border-b border-gray-50 z-20 shrink-0">
          
          {/* Menu chọn ngày (History Navigation) */}
          <div className="flex items-center justify-between mb-8 text-gray-400">
            <button onClick={() => changeDate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 font-semibold text-gray-700 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              <span className="text-sm">{formatDateDisplayName(currentDate)}</span>
            </div>
            <button 
              onClick={() => changeDate(1)} 
              disabled={currentDate === today} // Không cho tới tương lai
              className="p-2 -mr-2 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Tiêu đề & Tổng tiến độ */}
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
              학습 목표 (Mục tiêu học)
            </h1>
            
            <div className="flex items-center justify-between text-sm font-bold mt-5 mb-2.5">
              <span className="text-gray-500 tracking-wide text-xs">진행률 (TỔNG TIẾN ĐỘ)</span>
              <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-100/80 rounded-full h-3 overflow-hidden shadow-inner">
              <motion.div
                className="bg-gradient-to-r from-indigo-500 hover:from-indigo-400 to-blue-500 hover:to-blue-400 h-full rounded-full transition-colors"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
              />
            </div>
          </div>
        </div>

        {/* LIST & FORM AREA (Body cuộn được) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 bg-[#FAFAFA]">
          
          {/* Ô nhập liệu (chỉ thêm cho ngày hiện tại hoặc quá khứ) */}
          <form onSubmit={addGoal} className="flex gap-2 relative mb-6">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="새로운 목표 (Thêm mục tiêu mới)..." 
              className="flex-1 px-4 py-3.5 rounded-2xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 text-[15px] shadow-sm"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-4 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center shadow-md shadow-indigo-200"
              aria-label="Thêm"
            >
              <Plus className="w-5 h-5 mx-0.5" />
            </button>
          </form>

          {/* Danh sách mục tiêu */}
          <div className="pt-2">
            <AnimatePresence mode="popLayout">
              {currentGoals.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-white mt-4 shadow-sm"
                >
                  <img src="https://api.iconify.design/noto:open-book.svg" alt="book" className="w-14 h-14 mx-auto mb-4 opacity-80" />
                  <p className="font-semibold text-gray-500 mb-1">아직 목표가 없습니다</p>
                  <p className="text-sm">(Chưa có dữ liệu nào)</p>
                </motion.div>
              ) : (
                currentGoals.map((goal) => (
                  <motion.div
                    key={goal.id}
                    layout /* Để animation di chuyển mượt mà khi xóa object */
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20, transition: { duration: 0.2 } }}
                    className={`group relative flex flex-col p-4 sm:p-5 rounded-2xl border transition-all duration-300 mb-3.5 overflow-hidden shadow-sm ${
                      goal.completed
                        ? 'bg-gray-50/50 border-gray-100'
                        : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    {/* Phần Nền (Background fill) thể hiện % tiến độ ẩn dưới cùng */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-indigo-50/40 transition-all duration-300 ease-out pointer-events-none"
                      style={{ width: `${goal.progress}%` }}
                    />

                    <div className="flex items-start justify-between z-10 w-full mb-3.5 relative">
                      {/* Checkbox và Chữ */}
                      <label className="flex items-start gap-4 cursor-pointer flex-1 select-none pr-2">
                        <div className="relative mt-0.5 flex items-center justify-center shrink-0">
                          <input
                            type="checkbox"
                            checked={goal.completed}
                            onChange={() => toggleGoal(goal.id)}
                            className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-lg checked:bg-indigo-500 checked:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/30 transition-all cursor-pointer"
                          />
                          <CheckCircle2 className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                        </div>
                        
                        <span
                          className={`relative text-[15px] break-all leading-snug transition-colors duration-300 ${
                            goal.completed ? 'text-gray-400 font-normal' : 'text-gray-700 font-semibold'
                          }`}
                        >
                          {goal.text}
                          
                          {/* Dấu gạch ngang động (Strikethrough Animation) */}
                          <span
                            className={`absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-gray-400 transition-all duration-300 ease-out ${
                              goal.completed ? 'w-full opacity-100' : 'w-0 opacity-0'
                            }`}
                          ></span>
                        </span>
                      </label>

                      {/* Nút Xóa */}
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="text-gray-300 hover:text-red-500 p-1.5 -mr-1.5 -mt-1 rounded-xl hover:bg-red-50 bg-white shadow-sm border border-transparent hover:border-red-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all shrink-0"
                        title="삭제 (Xóa)"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Thanh Tiến Độ Cá Nhân (Slider) */}
                    <div className="flex items-center gap-3 pl-9 pr-1 relative z-10">
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={goal.progress}
                        onChange={(e) => updateGoalProgress(goal.id, Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-2 transition-all"
                      />
                      <span className={`text-[11px] font-bold w-8 text-right tabular-nums ${goal.completed ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {goal.progress}%
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
