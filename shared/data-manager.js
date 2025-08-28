// 통합 데이터 관리자 - 모든 페이지에서 공유하는 데이터 관리 (로컬 저장소)
class WorkoutDataManager {
    constructor() {
        this.storagePrefix = 'workout-app-';
        this.cloudDataManager = null;
        this.init();
    }
    
    // 클라우드 데이터 매니저 설정
    setCloudDataManager(cloudManager) {
        this.cloudDataManager = cloudManager;
        cloudManager.setLocalDataManager(this);
    }

    init() {
        // 기본 데이터 구조 초기화
        this.ensureDataStructure();
    }

    // 기본 데이터 구조 확인 및 초기화
    ensureDataStructure() {
        const defaultData = {
            exercises: {
                '하체': ['스쿼트', '레그프레스', '레그익스텐션', '레그컬', '스티프데드'],
                '등': ['바벨로우', '랫풀다운', '투암덤벨로우', '원암덤벨로우', '케이블로우', '어시스트풀업'],
                '가슴': ['벤치프레스', '덤벨 벤치프레스', '인클라인덤벨프레스', '인클라인스미스', '케이블 크로스오버', '펙덱 플라이'],
                '어깨': ['오버헤드프레스', '페이스풀', '사이드 레터럴 레이즈', '벤트 오버 레이즈', '리어 델트 플라이'],
                '팔': ['케이블푸쉬다운', '덤벨컬'],
                '코어': ['복부서킷']
            },
            workoutHistory: [],
            personalRecords: {},
            userPreferences: {
                lastSelectedBodyPart: '하체',
                timerDefault: 90, // 90초
                theme: 'light'
            },
            routineData: {
                lastWorkout: 'NONE',
                restDays: 1,
                weeklyPlan: null
            },
            stretchingProgress: {}
        };

        // 각 기본 데이터가 없으면 초기화
        Object.keys(defaultData).forEach(key => {
            if (!this.getData(key)) {
                this.setData(key, defaultData[key]);
            }
        });
    }

    // 데이터 가져오기
    getData(key) {
        try {
            const data = localStorage.getItem(this.storagePrefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error getting data for ${key}:`, error);
            return null;
        }
    }

    // 데이터 저장하기
    setData(key, value) {
        try {
            localStorage.setItem(this.storagePrefix + key, JSON.stringify(value));
            // 데이터 변경 이벤트 발생
            this.notifyDataChange(key, value);
            return true;
        } catch (error) {
            console.error(`Error setting data for ${key}:`, error);
            return false;
        }
    }

    // 데이터 삭제
    removeData(key) {
        try {
            localStorage.removeItem(this.storagePrefix + key);
            return true;
        } catch (error) {
            console.error(`Error removing data for ${key}:`, error);
            return false;
        }
    }

    // 운동 기록 추가 (하이브리드: 로컬 + 클라우드)
    async addWorkoutRecord(records) {
        // 로컬 저장
        const history = this.getData('workoutHistory') || [];
        const personalRecords = this.getData('personalRecords') || {};
        
        // 기록 추가
        const newHistory = [...records, ...history];
        this.setData('workoutHistory', newHistory);

        // 개인 기록 업데이트
        records.forEach(record => {
            const { name, weight, reps, date } = record;
            const currentPR = personalRecords[name];
            const newOneRM = this.calculateOneRM(weight, reps);
            
            if (!currentPR || newOneRM > currentPR.oneRM || 
                (newOneRM === currentPR.oneRM && weight > currentPR.weight)) {
                personalRecords[name] = { weight, reps, oneRM: newOneRM, date };
            }
        });
        
        this.setData('personalRecords', personalRecords);
        
        // 클라우드 저장 시도
        if (this.cloudDataManager) {
            try {
                for (const record of records) {
                    await this.cloudDataManager.saveWorkoutRecord(record);
                }
                
                for (const [exerciseName, pr] of Object.entries(personalRecords)) {
                    await this.cloudDataManager.savePersonalRecord(exerciseName, pr);
                }
            } catch (error) {
                console.warn('클라우드 저장 실패, 로컬에만 저장됨:', error);
            }
        }
        
        return { success: true, recordsAdded: records.length };
    }

    // 1RM 계산 (Epley Formula)
    calculateOneRM(weight, reps) {
        if (!Number.isFinite(weight) || !Number.isFinite(reps) || reps <= 0) return 0;
        if (reps === 1) return Math.round(weight);
        return Math.round(weight * (1 + reps / 30));
    }

    // 운동별 최근 기록 가져오기
    getExerciseHistory(exerciseName, limit = 10) {
        const history = this.getData('workoutHistory') || [];
        return history
            .filter(record => record.name === exerciseName)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    // 개인 기록 가져오기
    getPersonalRecord(exerciseName) {
        const personalRecords = this.getData('personalRecords') || {};
        return personalRecords[exerciseName] || null;
    }

    // 운동 라이브러리 관리
    addExercise(bodyPart, exerciseName) {
        const exercises = this.getData('exercises') || {};
        if (!exercises[bodyPart]) {
            exercises[bodyPart] = [];
        }
        
        if (!exercises[bodyPart].includes(exerciseName)) {
            exercises[bodyPart].push(exerciseName);
            exercises[bodyPart].sort();
            this.setData('exercises', exercises);
            return true;
        }
        return false;
    }

    removeExercise(bodyPart, exerciseName) {
        const exercises = this.getData('exercises') || {};
        if (exercises[bodyPart]) {
            exercises[bodyPart] = exercises[bodyPart].filter(name => name !== exerciseName);
            this.setData('exercises', exercises);
            return true;
        }
        return false;
    }

    // 사용자 설정 관리
    getUserPreference(key) {
        const preferences = this.getData('userPreferences') || {};
        return preferences[key];
    }

    setUserPreference(key, value) {
        const preferences = this.getData('userPreferences') || {};
        preferences[key] = value;
        return this.setData('userPreferences', preferences);
    }

    // 루틴 데이터 관리
    updateRoutineData(data) {
        const currentRoutineData = this.getData('routineData') || {};
        const newRoutineData = { ...currentRoutineData, ...data };
        return this.setData('routineData', newRoutineData);
    }

    getRoutineData() {
        return this.getData('routineData') || {
            lastWorkout: 'NONE',
            restDays: 1,
            weeklyPlan: null
        };
    }

    // 스트레칭 진행률 관리
    updateStretchingProgress(exerciseId, completed) {
        const progress = this.getData('stretchingProgress') || {};
        const today = new Date().toDateString();
        
        if (!progress[today]) {
            progress[today] = {};
        }
        
        progress[today][exerciseId] = completed;
        return this.setData('stretchingProgress', progress);
    }

    getStretchingProgress(date = null) {
        const progress = this.getData('stretchingProgress') || {};
        const targetDate = date || new Date().toDateString();
        return progress[targetDate] || {};
    }

    // 통계 데이터 생성
    getWorkoutStats(days = 30) {
        const history = this.getData('workoutHistory') || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentWorkouts = history.filter(record => 
            new Date(record.date) >= cutoffDate
        );

        const totalWorkouts = recentWorkouts.length;
        const uniqueDays = new Set(recentWorkouts.map(record => 
            new Date(record.date).toDateString()
        )).size;

        const bodyPartCounts = recentWorkouts.reduce((acc, record) => {
            acc[record.bodyPart] = (acc[record.bodyPart] || 0) + 1;
            return acc;
        }, {});

        const totalVolume = recentWorkouts.reduce((sum, record) => 
            sum + (record.weight * record.reps), 0
        );

        return {
            period: days,
            totalWorkouts,
            workoutDays: uniqueDays,
            totalVolume: Math.round(totalVolume),
            bodyPartBreakdown: bodyPartCounts,
            personalRecords: Object.keys(this.getData('personalRecords') || {}).length
        };
    }

    // 데이터 내보내기 (백업)
    exportData() {
        const allData = {};
        const keys = ['exercises', 'workoutHistory', 'personalRecords', 'userPreferences', 'routineData', 'stretchingProgress'];
        
        keys.forEach(key => {
            allData[key] = this.getData(key);
        });

        return JSON.stringify(allData, null, 2);
    }

    // 데이터 가져오기 (복원)
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            let importedCount = 0;

            Object.keys(data).forEach(key => {
                if (data[key] !== null) {
                    this.setData(key, data[key]);
                    importedCount++;
                }
            });

            return { success: true, importedCount };
        } catch (error) {
            console.error('Error importing data:', error);
            return { success: false, error: error.message };
        }
    }

    // 데이터 변경 알림 (이벤트 시스템)
    notifyDataChange(key, value) {
        const event = new CustomEvent('workoutDataChanged', {
            detail: { key, value, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }

    // 데이터 변경 리스너 등록
    onDataChange(callback) {
        window.addEventListener('workoutDataChanged', callback);
    }

    // 데이터 변경 리스너 제거
    offDataChange(callback) {
        window.removeEventListener('workoutDataChanged', callback);
    }

    // 전체 데이터 초기화 (주의!)
    clearAllData() {
        const keys = ['exercises', 'workoutHistory', 'personalRecords', 'userPreferences', 'routineData', 'stretchingProgress'];
        keys.forEach(key => this.removeData(key));
        this.ensureDataStructure(); // 기본 구조 재생성
        return true;
    }
}

// 전역 인스턴스 생성
window.workoutData = new WorkoutDataManager();

// 모듈로도 사용 가능하도록 export
window.WorkoutDataManager = WorkoutDataManager;