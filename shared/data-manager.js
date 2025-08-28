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
        // 운동 라이브러리 업데이트
        this.updateExerciseLibraryFromLatest();
    }

    // 기본 데이터 구조 확인 및 초기화
    ensureDataStructure() {
        const defaultData = {
exercises: {
            '하체': [
                '바벨 스쿼트', 
                '루마니안 데드리프트', 
                '힙 쓰러스트', 
                '레그 프레스', 
                '불가리안 스플릿 스쿼트', 
                '스미스머신 스쿼트',
                '시티드 레그 컬', 
                '레그 익스텐션',
                '스탠딩 카프 레이즈'
            ],
            '등': [
                '중량 풀업/어시스트 풀업', 
                '체스트 서포티드 로우',
                '바벨 로우', 
                '랫풀다운', 
                '원암 덤벨 로우', 
                '시티드 케이블 로우'
            ],
            '가슴': [
                '인클라인 덤벨 프레스',
                '바벨 벤치프레스', 
                '중량 딥스',
                '머신 체스트 프레스', 
                '덤벨 벤치프레스',
                '케이블 크로스오버', 
                '펙덱 플라이'
            ],
            '어깨': [
                '오버헤드 프레스', 
                '케이블 래터럴 레이즈',
                '사이드 래터럴 레이즈', 
                '페이스 풀', 
                '리버스 펙덱 플라이'
            ],
            '팔': [
                '인클라인 덤벨 컬',
                '바벨 컬',
                '오버헤드 익스텐션', 
                '스컬 크러셔',
                '클로즈 그립 벤치프레스', 
                '케이블 푸쉬다운'
            ],
            '코어': [
                '행잉 레그 레이즈', 
                '케이블 크런치', 
                '앱 롤아웃', 
                '플랭크', 
                '사이드 플랭크',
                '복부서킷'
            ]
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

    // 운동 라이브러리 관리 (클라우드 동기화 포함)
    async addExercise(bodyPart, exerciseName) {
        const exercises = this.getData('exercises') || {};
        if (!exercises[bodyPart]) {
            exercises[bodyPart] = [];
        }
        
        if (!exercises[bodyPart].includes(exerciseName)) {
            exercises[bodyPart].push(exerciseName);
            exercises[bodyPart].sort();
            this.setData('exercises', exercises);
            
            // 클라우드에도 사용자 추가 운동 저장
            if (this.cloudDataManager) {
                try {
                    await this.cloudDataManager.saveUserExercise(bodyPart, exerciseName);
                } catch (error) {
                    console.warn('클라우드 운동 저장 실패, 로컬에만 저장됨:', error);
                }
            }
            return true;
        }
        return false;
    }

    async removeExercise(bodyPart, exerciseName) {
        const exercises = this.getData('exercises') || {};
        if (exercises[bodyPart]) {
            exercises[bodyPart] = exercises[bodyPart].filter(name => name !== exerciseName);
            this.setData('exercises', exercises);
            
            // 클라우드에서도 사용자 추가 운동 제거
            if (this.cloudDataManager) {
                try {
                    await this.cloudDataManager.removeUserExercise(bodyPart, exerciseName);
                } catch (error) {
                    console.warn('클라우드 운동 제거 실패:', error);
                }
            }
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

    // 운동 라이브러리 업데이트 (정리된 최신 버전)
    async updateExerciseLibraryFromLatest() {
        const LATEST_EXERCISE_LIBRARY = {
            '하체': [
                '바벨 스쿼트', 
                '루마니안 데드리프트', 
                '힙 쓰러스트', 
                '레그 프레스', 
                '불가리안 스플릿 스쿼트', 
                '스미스머신 스쿼트',
                '시티드 레그 컬', 
                '레그 익스텐션',
                '스탠딩 카프 레이즈'
            ],
            '등': [
                '중량 풀업/어시스트 풀업', 
                '체스트 서포티드 로우',
                '바벨 로우', 
                '랫풀다운', 
                '원암 덤벨 로우', 
                '시티드 케이블 로우'
            ],
            '가슴': [
                '인클라인 덤벨 프레스',
                '바벨 벤치프레스', 
                '중량 딥스',
                '머신 체스트 프레스', 
                '덤벨 벤치프레스',
                '케이블 크로스오버', 
                '펙덱 플라이'
            ],
            '어깨': [
                '오버헤드 프레스', 
                '케이블 래터럴 레이즈',
                '사이드 래터럴 레이즈', 
                '페이스 풀', 
                '리버스 펙덱 플라이'
            ],
            '팔': [
                '인클라인 덤벨 컬',
                '바벨 컬',
                '오버헤드 익스텐션', 
                '스컬 크러셔',
                '클로즈 그립 벤치프레스', 
                '케이블 푸쉬다운'
            ],
            '코어': [
                '행잉 레그 레이즈', 
                '케이블 크런치', 
                '앱 롤아웃', 
                '플랭크', 
                '사이드 플랭크',
                '복부서킷'
            ]
        };

        // 기존 사용자 추가 운동들 보존
        const currentExercises = this.getData('exercises') || {};
        const userAddedExercises = {};
        
        // 기본 라이브러리에 없는 운동들을 사용자 추가 운동으로 분류
        Object.keys(currentExercises).forEach(bodyPart => {
            if (currentExercises[bodyPart]) {
                const userExercises = currentExercises[bodyPart].filter(exercise => 
                    !LATEST_EXERCISE_LIBRARY[bodyPart]?.includes(exercise)
                );
                if (userExercises.length > 0) {
                    userAddedExercises[bodyPart] = userExercises;
                }
            }
        });
        
        // 최신 라이브러리로 초기화
        const cleanedExercises = JSON.parse(JSON.stringify(LATEST_EXERCISE_LIBRARY));
        
        // 사용자 추가 운동들을 다시 병합
        Object.keys(userAddedExercises).forEach(bodyPart => {
            if (!cleanedExercises[bodyPart]) {
                cleanedExercises[bodyPart] = [];
            }
            cleanedExercises[bodyPart].push(...userAddedExercises[bodyPart]);
            cleanedExercises[bodyPart].sort();
        });
        
        this.setData('exercises', cleanedExercises);
        
        // 클라우드에서 사용자 추가 운동 동기화
        if (this.cloudDataManager) {
            try {
                await this.syncUserExercisesFromCloud();
            } catch (error) {
                console.warn('클라우드 운동 동기화 실패:', error);
            }
        }
        
        console.log('✅ 운동 라이브러리가 정리되고 최신 버전으로 업데이트되었습니다.');
        console.log('📚 현재 운동 수:', Object.values(cleanedExercises).reduce((sum, arr) => sum + arr.length, 0));
    }
    
    // 클라우드에서 사용자 추가 운동 동기화
    async syncUserExercisesFromCloud() {
        if (!this.cloudDataManager) return;
        
        try {
            const cloudExercises = await this.cloudDataManager.getUserExercises();
            const currentExercises = this.getData('exercises') || {};
            
            // 클라우드 운동들을 로컬에 병합
            Object.keys(cloudExercises).forEach(bodyPart => {
                if (!currentExercises[bodyPart]) {
                    currentExercises[bodyPart] = [];
                }
                
                cloudExercises[bodyPart].forEach(exercise => {
                    if (!currentExercises[bodyPart].includes(exercise)) {
                        currentExercises[bodyPart].push(exercise);
                    }
                });
                
                currentExercises[bodyPart].sort();
            });
            
            this.setData('exercises', currentExercises);
            console.log('☁️ 클라우드 사용자 운동이 동기화되었습니다.');
        } catch (error) {
            console.error('❌ 클라우드 운동 동기화 실패:', error);
        }
    }
}

// 전역 인스턴스 생성
window.workoutData = new WorkoutDataManager();

// 모듈로도 사용 가능하도록 export
window.WorkoutDataManager = WorkoutDataManager;