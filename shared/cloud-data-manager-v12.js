// Firebase v12 Cloud Data Manager
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    serverTimestamp,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    signInAnonymously, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// Disable automatic local→cloud sync by default
const AUTO_SYNC_ENABLED = false;

class CloudDataManager {
    constructor() {
        this.currentUser = null;
        this.isOnline = navigator.onLine;
        this.localDataManager = null;
        this.db = window.db;
        this.auth = window.auth;
        this.authListeners = [];
        
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('온라인 상태 - 데이터 동기화 시작');
            if (AUTO_SYNC_ENABLED) this.syncLocalToCloud();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('오프라인 상태 - 로컬 저장만 활성화');
        });
        
        // 인증 상태 변화 감지
        if (this.auth) {
            onAuthStateChanged(this.auth, (user) => {
                this.currentUser = user;
                if (user) {
                    console.log('✅ 사용자 로그인됨:', {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        isAnonymous: user.isAnonymous
                    });
                    if (AUTO_SYNC_ENABLED) this.syncLocalToCloud();
                } else {
                    console.log('❌ 사용자 로그아웃됨');
                }
                
                // 등록된 리스너들에게 알림
                this.authListeners.forEach(callback => callback(user));
            });
        }
    }
    
    // 로컬 데이터 매니저 설정
    setLocalDataManager(localManager) {
        this.localDataManager = localManager;
    }
    
    // 인증 상태 변화 리스너 등록 (Firebase 호환)
    onAuthStateChanged(callback) {
        this.authListeners.push(callback);
        // 현재 상태로 즉시 콜백 실행
        callback(this.currentUser);
    }
    
    // Google 로그인
    async signInWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            const result = await signInWithPopup(this.auth, provider);
            console.log('🎉 Google 로그인 성공:', result.user.email);
            return result.user;
        } catch (error) {
            console.error('❌ Google 로그인 실패:', error);
            throw error;
        }
    }
    
    // 익명 로그인
    async signInAnonymously() {
        try {
            const result = await signInAnonymously(this.auth);
            console.log('👤 익명 로그인 성공:', result.user.uid);
            return result.user;
        } catch (error) {
            console.error('❌ 익명 로그인 실패:', error);
            throw error;
        }
    }
    
    // 로그아웃
    async signOutUser() {
        try {
            await signOut(this.auth);
            console.log('👋 로그아웃 완료');
        } catch (error) {
            console.error('❌ 로그아웃 실패:', error);
            throw error;
        }
    }
    
    // 사용자 ID 반환
    getUserId() {
        return this.currentUser?.uid || 'anonymous';
    }
    
    // 운동 기록 저장
    async saveWorkoutRecord(record) {
        // 로컬에 먼저 저장
        // 로컬 반영은 호출측(WorkoutDataManager)에서 처리. 여기서 호출하면 재귀/중복 저장 발생
        // if (this.localDataManager) {
        //     await this.localDataManager.addWorkoutRecord([record]);
        // }
        
        // 온라인이고 로그인된 경우 클라우드에도 저장
        if (!this.isOnline || !this.db || !this.currentUser) {
            console.log('오프라인 또는 미로그인 - 로컬에만 저장');
            return record;
        }
        
        try {
            const userId = this.getUserId();
            const recordId = record.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const recordWithTimestamp = {
                ...record,
                id: recordId,
                userId: userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                synced: true
            };
            
            await setDoc(doc(this.db, 'workoutRecords', recordId), recordWithTimestamp);
            console.log('☁️ 운동 기록 클라우드 저장:', recordId);
            return recordWithTimestamp;
        } catch (error) {
            console.error('❌ 클라우드 저장 실패 - 로컬에만 저장:', error);
            return record;
        }
    }
    
    // 운동 기록 조회
    async getWorkoutRecords() {
        // 로그인되지 않았거나 오프라인인 경우 로컬 데이터 반환
        if (!this.isOnline || !this.db || !this.currentUser) {
            return this.localDataManager?.getWorkoutRecords() || [];
        }
        
        try {
            const userId = this.getUserId();
            const q = query(
                collection(this.db, 'workoutRecords'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const records = [];
            
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                records.push({
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
                    updatedAt: data.updatedAt?.toDate() || new Date(data.updatedAt)
                });
            });
            
            console.log('☁️ 클라우드에서 운동 기록 조회:', records.length + '개');
            
            // 로컬과 클라우드 데이터 병합
            const localRecords = this.localDataManager?.getWorkoutRecords() || [];
            const mergedRecords = this.mergeRecords(localRecords, records);
            
            return mergedRecords;
        } catch (error) {
            console.error('❌ 클라우드 조회 실패 - 로컬 데이터 사용:', error);
            return this.localDataManager?.getWorkoutRecords() || [];
        }
    }
    
    // 개인 기록 저장
    async savePersonalRecord(exercise, record) {
        // 로컬에 먼저 저장
        if (this.localDataManager) {
            const personalRecords = this.localDataManager.getPersonalRecords();
            personalRecords[exercise] = record;
            this.localDataManager.setData('personalRecords', personalRecords);
        }
        
        if (!this.isOnline || !this.db || !this.currentUser) {
            return record;
        }
        
        try {
            const userId = this.getUserId();
            const recordId = `${userId}_${exercise.replace(/\s+/g, '_')}`;
            
            const personalRecord = {
                userId: userId,
                exercise: exercise,
                ...record,
                updatedAt: serverTimestamp()
            };
            
            await setDoc(doc(this.db, 'personalRecords', recordId), personalRecord);
            console.log('☁️ 개인 기록 클라우드 저장:', exercise);
            return personalRecord;
        } catch (error) {
            console.error('❌ 개인 기록 클라우드 저장 실패:', error);
            return record;
        }
    }
    
    // 개인 기록 조회
    async getPersonalRecords() {
        if (!this.isOnline || !this.db || !this.currentUser) {
            return this.localDataManager?.getPersonalRecords() || {};
        }
        
        try {
            const userId = this.getUserId();
            const q = query(
                collection(this.db, 'personalRecords'),
                where('userId', '==', userId)
            );
            
            const querySnapshot = await getDocs(q);
            const records = {};
            
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                records[data.exercise] = {
                    weight: data.weight,
                    reps: data.reps,
                    oneRM: data.oneRM,
                    date: data.updatedAt?.toDate() || new Date(data.updatedAt)
                };
            });
            
            console.log('☁️ 클라우드에서 개인 기록 조회:', Object.keys(records).length + '개');
            
            // 로컬 데이터와 병합 (최신 날짜 우선)
            const localRecords = this.localDataManager?.getPersonalRecords() || {};
            return this.mergePersonalRecords(localRecords, records);
        } catch (error) {
            console.error('❌ 개인 기록 클라우드 조회 실패:', error);
            return this.localDataManager?.getPersonalRecords() || {};
        }
    }
    
    // 로컬 데이터를 클라우드로 동기화
    async syncLocalToCloud() {
        if (!this.isOnline || !this.localDataManager || !this.db || !this.currentUser) {
            return;
        }
        
        try {
            console.log('🔄 로컬 데이터 클라우드 동기화 시작...');
            
            // 로컬 운동 기록 동기화 (성공 시 로컬에도 synced 반영)
            const localRecords = this.localDataManager.getData('workoutHistory') || [];
            let syncedCount = 0;
            // 대용량 동기화로 인한 프리즈 방지: 한 세션당 최대 처리 개수 제한
            const MAX_SYNC_PER_SESSION = 200;
            try {
                let unsyncedCount = 0;
                for (let i = 0; i < localRecords.length; i++) {
                    if (!localRecords[i]?.synced) unsyncedCount++;
                }
                if (unsyncedCount > MAX_SYNC_PER_SESSION) {
                    console.warn(`동기화 대기 항목이 많아(${unsyncedCount}개), 이번 세션에는 최대 ${MAX_SYNC_PER_SESSION}개만 처리합니다.`);
                }
            } catch (_) {}
            let changed = false;
            for (let i = 0; i < localRecords.length && syncedCount < MAX_SYNC_PER_SESSION; i++) {
                const rec = localRecords[i];
                if (!rec.synced) {
                    try {
                        await this.saveWorkoutRecord({ ...rec, synced: true });
                        localRecords[i] = { ...rec, synced: true };
                        syncedCount++;
                        changed = true;
                    } catch (error) {
                        console.error('운동 기록 동기화 실패:', error);
                    }
                }
            }
            if (changed) {
                this.localDataManager.setData('workoutHistory', localRecords);
            }
            
            // 로컬 개인 기록 동기화
            const localPRs = this.localDataManager.getData('personalRecords') || {};
            let prSyncedCount = 0;
            
            for (const [exercise, record] of Object.entries(localPRs)) {
                try {
                    await this.savePersonalRecord(exercise, record);
                    prSyncedCount++;
                } catch (error) {
                    console.error('개인 기록 동기화 실패:', error);
                }
            }
            
            // 사용자 추가 운동 동기화
            await this.syncUserExercisesToCloud();
            
            // 클라우드에서 사용자 운동 가져와서 로컬과 병합
            if (this.localDataManager.syncUserExercisesFromCloud) {
                await this.localDataManager.syncUserExercisesFromCloud();
            }
            
            console.log(`✅ 동기화 완료 - 운동기록: ${syncedCount}개, 개인기록: ${prSyncedCount}개`);
        } catch (error) {
            console.error('❌ 데이터 동기화 실패:', error);
        }
    }
    
    // 로컬 사용자 추가 운동을 클라우드로 동기화
    async syncUserExercisesToCloud() {
        if (!this.localDataManager) return;
        
        try {
            const LATEST_EXERCISE_LIBRARY = {
                '하체': ['바벨 스쿼트', '루마니안 데드리프트', '힙 쓰러스트', '레그 프레스', '불가리안 스플릿 스쿼트', '스미스머신 스쿼트', '시티드 레그 컬', '레그 익스텐션', '스탠딩 카프 레이즈'],
                '등': ['중량 풀업/어시스트 풀업', '체스트 서포티드 로우', '바벨 로우', '랫풀다운', '원암 덤벨 로우', '시티드 케이블 로우'],
                '가슴': ['인클라인 덤벨 프레스', '바벨 벤치프레스', '중량 딥스', '머신 체스트 프레스', '덤벨 벤치프레스', '케이블 크로스오버', '펙덱 플라이'],
                '어깨': ['오버헤드 프레스', '케이블 래터럴 레이즈', '사이드 래터럴 레이즈', '페이스 풀', '리버스 펙덱 플라이'],
                '팔': ['인클라인 덤벨 컬', '바벨 컬', '오버헤드 익스텐션', '스컬 크러셔', '클로즈 그립 벤치프레스', '케이블 푸쉬다운'],
                '코어': ['행잉 레그 레이즈', '케이블 크런치', '앱 롤아웃', '플랭크', '사이드 플랭크', '복부서킷']
            };
            
            const localExercises = this.localDataManager.getData('exercises') || {};
            let userExerciseSyncCount = 0;
            
            for (const [bodyPart, exercises] of Object.entries(localExercises)) {
                const userAddedExercises = exercises.filter(exercise => 
                    !LATEST_EXERCISE_LIBRARY[bodyPart]?.includes(exercise)
                );
                
                for (const exercise of userAddedExercises) {
                    try {
                        await this.saveUserExercise(bodyPart, exercise);
                        userExerciseSyncCount++;
                    } catch (error) {
                        console.error('사용자 운동 동기화 실패:', error);
                    }
                }
            }
            
            console.log(`☁️ 사용자 운동 동기화 완료: ${userExerciseSyncCount}개`);
        } catch (error) {
            console.error('❌ 사용자 운동 동기화 실패:', error);
        }
    }
    
    // 운동 기록 병합 (중복 제거)
    mergeRecords(localRecords, cloudRecords) {
        const recordMap = new Map();
        
        // 로컬 기록 추가
        localRecords.forEach(record => {
            recordMap.set(record.id || record.name + record.date + record.setNumber, record);
        });
        
        // 클라우드 기록 추가 (중복시 덮어쓰기)
        cloudRecords.forEach(record => {
            recordMap.set(record.id || record.name + record.date + record.setNumber, record);
        });
        
        return Array.from(recordMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    // 개인 기록 병합 (최신 날짜 우선)
    mergePersonalRecords(localRecords, cloudRecords) {
        const merged = {...localRecords};
        
        Object.keys(cloudRecords).forEach(exercise => {
            const localRecord = merged[exercise];
            const cloudRecord = cloudRecords[exercise];
            
            if (!localRecord || new Date(cloudRecord.date) > new Date(localRecord.date)) {
                merged[exercise] = cloudRecord;
            }
        });
        
        return merged;
    }
    
    // 사용자 추가 운동 저장
    async saveUserExercise(bodyPart, exerciseName) {
        if (!this.isOnline || !this.db || !this.currentUser) {
            return false;
        }
        
        try {
            const userId = this.getUserId();
            const exerciseId = `${userId}_${bodyPart}_${exerciseName.replace(/\s+/g, '_')}`;
            
            const userExercise = {
                userId: userId,
                bodyPart: bodyPart,
                exerciseName: exerciseName,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            await setDoc(doc(this.db, 'userExercises', exerciseId), userExercise);
            console.log('☁️ 사용자 운동 클라우드 저장:', exerciseName);
            return true;
        } catch (error) {
            console.error('❌ 사용자 운동 클라우드 저장 실패:', error);
            return false;
        }
    }
    
    // 사용자 추가 운동 제거
    async removeUserExercise(bodyPart, exerciseName) {
        if (!this.isOnline || !this.db || !this.currentUser) {
            return false;
        }
        
        try {
            const userId = this.getUserId();
            const exerciseId = `${userId}_${bodyPart}_${exerciseName.replace(/\s+/g, '_')}`;
            
            await deleteDoc(doc(this.db, 'userExercises', exerciseId));
            console.log('☁️ 사용자 운동 클라우드 제거:', exerciseName);
            return true;
        } catch (error) {
            console.error('❌ 사용자 운동 클라우드 제거 실패:', error);
            return false;
        }
    }
    
    // 사용자 추가 운동 목록 조회
    async getUserExercises() {
        if (!this.isOnline || !this.db || !this.currentUser) {
            return {};
        }
        
        try {
            const userId = this.getUserId();
            const q = query(
                collection(this.db, 'userExercises'),
                where('userId', '==', userId)
            );
            
            const querySnapshot = await getDocs(q);
            const exercises = {};
            
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (!exercises[data.bodyPart]) {
                    exercises[data.bodyPart] = [];
                }
                exercises[data.bodyPart].push(data.exerciseName);
            });
            
            // 각 부위별 운동을 알파벳 순으로 정렬
            Object.keys(exercises).forEach(bodyPart => {
                exercises[bodyPart].sort();
            });
            
            console.log('☁️ 클라우드에서 사용자 운동 조회:', Object.values(exercises).reduce((sum, arr) => sum + arr.length, 0) + '개');
            return exercises;
        } catch (error) {
            console.error('❌ 클라우드 사용자 운동 조회 실패:', error);
            return {};
        }
    }

    // 1RM 계산
    calculateOneRM(weight, reps) {
        if (reps === 1) return weight;
        return Math.round(weight * (1 + (reps / 30)));
    }
    
    // 실시간 데이터 구독
    subscribeToWorkoutRecords(callback) {
        if (!this.isOnline || !this.db || !this.currentUser) {
            return null;
        }
        
        try {
            const userId = this.getUserId();
            const q = query(
                collection(this.db, 'workoutRecords'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            
            return onSnapshot(q, (querySnapshot) => {
                const records = [];
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    records.push({
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
                        updatedAt: data.updatedAt?.toDate() || new Date(data.updatedAt)
                    });
                });
                console.log('🔄 실시간 운동 기록 업데이트:', records.length + '개');
                callback(records);
            });
        } catch (error) {
            console.error('❌ 실시간 구독 실패:', error);
            return null;
        }
    }
}

// 전역에서 사용할 수 있도록 export
window.CloudDataManager = CloudDataManager;
export default CloudDataManager;
