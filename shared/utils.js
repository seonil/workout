// 공통 유틸리티 함수 모음
const WorkoutUtils = {
    // 날짜 관련 유틸리티
    date: {
        // 한국어 날짜 포맷 (YYYY.MM.DD)
        formatKorean(date) {
            const d = new Date(date);
            return d.toLocaleDateString('ko-KR');
        },

        // 상대적 시간 표시 (예: "2일 전", "방금 전")
        getRelativeTime(date) {
            const now = new Date();
            const target = new Date(date);
            const diffInSeconds = Math.floor((now - target) / 1000);

            const intervals = [
                { label: '년', seconds: 31536000 },
                { label: '개월', seconds: 2592000 },
                { label: '주', seconds: 604800 },
                { label: '일', seconds: 86400 },
                { label: '시간', seconds: 3600 },
                { label: '분', seconds: 60 }
            ];

            for (const interval of intervals) {
                const count = Math.floor(diffInSeconds / interval.seconds);
                if (count > 0) {
                    return `${count}${interval.label} 전`;
                }
            }

            return '방금 전';
        },

        // 오늘의 시작 시간
        getStartOfDay(date = new Date()) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            return start;
        },

        // 일주일 전 날짜
        getWeekAgo(date = new Date()) {
            const weekAgo = new Date(date);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return weekAgo;
        },

        // 한 달 전 날짜
        getMonthAgo(date = new Date()) {
            const monthAgo = new Date(date);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return monthAgo;
        }
    },

    // 숫자 관련 유틸리티
    number: {
        // 천 단위 콤마 추가
        addCommas(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },

        // 소수점 반올림
        round(num, decimals = 2) {
            return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
        },

        // 범위 내 값 제한
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },

        // 퍼센트 계산
        getPercentage(part, total) {
            if (total === 0) return 0;
            return Math.round((part / total) * 100);
        }
    },

    // 운동 관련 계산
    workout: {
        // 1RM 계산 (Epley Formula)
        calculateOneRM(weight, reps) {
            if (!Number.isFinite(weight) || !Number.isFinite(reps) || reps <= 0) return 0;
            if (reps === 1) return Math.round(weight);
            return Math.round(weight * (1 + reps / 30));
        },

        // 볼륨 계산 (무게 × 반복수)
        calculateVolume(weight, reps) {
            return (parseFloat(weight) || 0) * (parseInt(reps) || 0);
        },

        // 세트별 볼륨 총합
        calculateTotalVolume(sets) {
            return sets.reduce((total, set) => {
                return total + this.calculateVolume(set.weight, set.reps);
            }, 0);
        },

        // 유효한 세트 필터링 (무게와 반복수가 모두 있는 세트)
        getValidSets(sets) {
            return sets.filter(set => 
                (parseFloat(set.weight) || 0) > 0 && 
                (parseInt(set.reps) || 0) > 0
            );
        },

        // 세트의 강도 계산 (1RM 대비 %)
        calculateIntensity(weight, oneRM) {
            if (!oneRM || oneRM === 0) return 0;
            return Math.round((weight / oneRM) * 100);
        }
    },

    // DOM 관련 유틸리티
    dom: {
        // 요소가 뷰포트에 보이는지 확인
        isElementVisible(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        // 부드러운 스크롤
        smoothScrollTo(element, offset = 0) {
            const elementPosition = element.offsetTop;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        },

        // 클래스 토글 (여러 요소)
        toggleClassForAll(elements, className, condition) {
            elements.forEach(element => {
                if (condition) {
                    element.classList.add(className);
                } else {
                    element.classList.remove(className);
                }
            });
        },

        // 요소 생성 및 속성 설정
        createElement(tag, attributes = {}, textContent = '') {
            const element = document.createElement(tag);
            
            Object.keys(attributes).forEach(key => {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'dataset') {
                    Object.keys(attributes[key]).forEach(dataKey => {
                        element.dataset[dataKey] = attributes[key][dataKey];
                    });
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            });

            if (textContent) {
                element.textContent = textContent;
            }

            return element;
        }
    },

    // 타이머 관련 유틸리티
    timer: {
        // 시간을 MM:SS 포맷으로 변환
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        },

        // 디바운스 함수
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // 쓰로틀 함수
        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    },

    // 로컬 스토리지 관련 유틸리티
    storage: {
        // 안전한 JSON 파싱
        safeGet(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error(`Error getting localStorage item ${key}:`, error);
                return defaultValue;
            }
        },

        // 안전한 JSON 저장
        safeSet(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error(`Error setting localStorage item ${key}:`, error);
                return false;
            }
        },

        // 로컬 스토리지 사용량 확인
        getStorageSize() {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return total;
        }
    },

    // 배열 관련 유틸리티
    array: {
        // 배열에서 중복 제거
        unique(array) {
            return [...new Set(array)];
        },

        // 배열을 청크 단위로 분할
        chunk(array, size) {
            const chunks = [];
            for (let i = 0; i < array.length; i += size) {
                chunks.push(array.slice(i, i + size));
            }
            return chunks;
        },

        // 배열에서 랜덤 요소 선택
        randomElement(array) {
            return array[Math.floor(Math.random() * array.length)];
        },

        // 배열 섞기 (Fisher-Yates algorithm)
        shuffle(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }
    },

    // 검증 관련 유틸리티
    validate: {
        // 이메일 형식 검증
        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        // 숫자인지 확인
        isNumber(value) {
            return !isNaN(value) && !isNaN(parseFloat(value));
        },

        // 양수인지 확인
        isPositiveNumber(value) {
            return this.isNumber(value) && parseFloat(value) > 0;
        },

        // 빈 값인지 확인
        isEmpty(value) {
            return value === null || value === undefined || value === '';
        },

        // 운동 세트 데이터 검증
        isValidSet(set) {
            return set && 
                   this.isPositiveNumber(set.weight) && 
                   this.isPositiveNumber(set.reps);
        }
    },

    // 색상 관련 유틸리티
    color: {
        // 16진수를 RGB로 변환
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        // RGB를 16진수로 변환
        rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },

        // 색상의 밝기 계산
        getBrightness(hex) {
            const rgb = this.hexToRgb(hex);
            if (!rgb) return 0;
            return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        }
    },

    // 애니메이션 관련 유틸리티
    animation: {
        // CSS 클래스를 이용한 애니메이션
        animateWithClass(element, className, duration = 1000) {
            return new Promise((resolve) => {
                element.classList.add(className);
                setTimeout(() => {
                    element.classList.remove(className);
                    resolve();
                }, duration);
            });
        },

        // 페이드 인 효과
        fadeIn(element, duration = 300) {
            element.style.opacity = 0;
            element.style.display = 'block';
            
            const fadeEffect = setInterval(() => {
                if (!element.style.opacity) {
                    element.style.opacity = 0;
                }
                if (element.style.opacity < 1) {
                    element.style.opacity = parseFloat(element.style.opacity) + 0.1;
                } else {
                    clearInterval(fadeEffect);
                }
            }, duration / 10);
        },

        // 페이드 아웃 효과
        fadeOut(element, duration = 300) {
            const fadeEffect = setInterval(() => {
                if (!element.style.opacity) {
                    element.style.opacity = 1;
                }
                if (element.style.opacity > 0) {
                    element.style.opacity = parseFloat(element.style.opacity) - 0.1;
                } else {
                    clearInterval(fadeEffect);
                    element.style.display = 'none';
                }
            }, duration / 10);
        }
    },

    // 이벤트 관련 유틸리티
    event: {
        // 커스텀 이벤트 생성 및 발생
        emit(eventName, detail = {}) {
            const event = new CustomEvent(eventName, { detail });
            window.dispatchEvent(event);
        },

        // 이벤트 리스너 추가 (자동 제거 옵션)
        on(eventName, handler, options = {}) {
            window.addEventListener(eventName, handler, options);
            
            // 자동 제거 함수 반환
            return () => window.removeEventListener(eventName, handler);
        },

        // 한 번만 실행되는 이벤트 리스너
        once(eventName, handler) {
            const onceHandler = (event) => {
                handler(event);
                window.removeEventListener(eventName, onceHandler);
            };
            window.addEventListener(eventName, onceHandler);
        }
    }
};

// 전역에서 사용할 수 있도록 export
window.WorkoutUtils = WorkoutUtils;