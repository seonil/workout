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
            this.syncLocalToCloud();
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
                    this.syncLocalToCloud();
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
        if (this.localDataManager) {
            await this.localDataManager.addWorkoutRecord([record]);
        }
        
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
            
            // 로컬 운동 기록 동기화
            const localRecords = this.localDataManager.getWorkoutRecords();
            let syncedCount = 0;
            
            for (const record of localRecords) {
                if (!record.synced) {
                    try {
                        await this.saveWorkoutRecord({...record, synced: true});
                        syncedCount++;
                    } catch (error) {
                        console.error('운동 기록 동기화 실패:', error);
                    }
                }
            }
            
            // 로컬 개인 기록 동기화
            const localPRs = this.localDataManager.getPersonalRecords();
            let prSyncedCount = 0;
            
            for (const [exercise, record] of Object.entries(localPRs)) {
                try {
                    await this.savePersonalRecord(exercise, record);
                    prSyncedCount++;
                } catch (error) {
                    console.error('개인 기록 동기화 실패:', error);
                }
            }
            
            console.log(`✅ 동기화 완료 - 운동기록: ${syncedCount}개, 개인기록: ${prSyncedCount}개`);
        } catch (error) {
            console.error('❌ 데이터 동기화 실패:', error);
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