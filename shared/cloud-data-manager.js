// Firebase Cloud Data Manager
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    signInAnonymously, 
    onAuthStateChanged, 
    signOut 
} from 'firebase/auth';
import { db, auth } from '../firebase-config.js';

class CloudDataManager {
    constructor() {
        this.currentUser = null;
        this.isOnline = navigator.onLine;
        this.localDataManager = null;
        
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncLocalToCloud();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        // 인증 상태 변화 감지
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            if (user) {
                console.log('사용자 로그인됨:', user.uid);
                this.syncLocalToCloud();
            } else {
                console.log('사용자 로그아웃됨');
            }
        });
    }
    
    // 로컬 데이터 매니저 설정 (백업용)
    setLocalDataManager(localManager) {
        this.localDataManager = localManager;
    }
    
    // Google 로그인
    async signInWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error('Google 로그인 실패:', error);
            throw error;
        }
    }
    
    // 익명 로그인
    async signInAnonymously() {
        try {
            const result = await signInAnonymously(auth);
            return result.user;
        } catch (error) {
            console.error('익명 로그인 실패:', error);
            throw error;
        }
    }
    
    // 로그아웃
    async signOutUser() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('로그아웃 실패:', error);
            throw error;
        }
    }
    
    // 사용자 ID 반환
    getUserId() {
        return this.currentUser?.uid || 'anonymous';
    }
    
    // 운동 기록 저장
    async saveWorkoutRecord(record) {
        if (!this.isOnline) {
            // 오프라인일 때는 로컬에 저장
            return this.localDataManager?.addWorkoutRecord(record);
        }
        
        try {
            const userId = this.getUserId();
            const recordId = record.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const recordWithTimestamp = {
                ...record,
                id: recordId,
                userId: userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            await setDoc(
                doc(db, 'workoutRecords', recordId),
                recordWithTimestamp
            );
            
            console.log('운동 기록 저장됨:', recordId);
            return recordWithTimestamp;
        } catch (error) {
            console.error('운동 기록 저장 실패:', error);
            // 실패 시 로컬에 저장
            return this.localDataManager?.addWorkoutRecord(record);
        }
    }
    
    // 운동 기록 조회
    async getWorkoutRecords() {
        if (!this.isOnline) {
            return this.localDataManager?.getWorkoutRecords() || [];
        }
        
        try {
            const userId = this.getUserId();
            const q = query(
                collection(db, 'workoutRecords'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const records = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                records.push({
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
                    updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
                });
            });
            
            return records;
        } catch (error) {
            console.error('운동 기록 조회 실패:', error);
            return this.localDataManager?.getWorkoutRecords() || [];
        }
    }
    
    // 개인 기록 저장
    async savePersonalRecord(exercise, record) {
        if (!this.isOnline) {
            return this.localDataManager?.updatePersonalRecord(exercise, record);
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
            
            await setDoc(
                doc(db, 'personalRecords', recordId),
                personalRecord
            );
            
            console.log('개인 기록 저장됨:', exercise);
            return personalRecord;
        } catch (error) {
            console.error('개인 기록 저장 실패:', error);
            return this.localDataManager?.updatePersonalRecord(exercise, record);
        }
    }
    
    // 개인 기록 조회
    async getPersonalRecords() {
        if (!this.isOnline) {
            return this.localDataManager?.getPersonalRecords() || {};
        }
        
        try {
            const userId = this.getUserId();
            const q = query(
                collection(db, 'personalRecords'),
                where('userId', '==', userId)
            );
            
            const querySnapshot = await getDocs(q);
            const records = {};
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                records[data.exercise] = {
                    weight: data.weight,
                    reps: data.reps,
                    date: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
                };
            });
            
            return records;
        } catch (error) {
            console.error('개인 기록 조회 실패:', error);
            return this.localDataManager?.getPersonalRecords() || {};
        }
    }
    
    // 설정 저장
    async saveUserPreferences(preferences) {
        if (!this.isOnline) {
            return this.localDataManager?.saveUserPreferences(preferences);
        }
        
        try {
            const userId = this.getUserId();
            
            await setDoc(
                doc(db, 'userPreferences', userId),
                {
                    ...preferences,
                    userId: userId,
                    updatedAt: serverTimestamp()
                }
            );
            
            console.log('사용자 설정 저장됨');
            return preferences;
        } catch (error) {
            console.error('사용자 설정 저장 실패:', error);
            return this.localDataManager?.saveUserPreferences(preferences);
        }
    }
    
    // 설정 조회
    async getUserPreferences() {
        if (!this.isOnline) {
            return this.localDataManager?.getUserPreferences() || {};
        }
        
        try {
            const userId = this.getUserId();
            const docSnap = await getDoc(doc(db, 'userPreferences', userId));
            
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return {};
            }
        } catch (error) {
            console.error('사용자 설정 조회 실패:', error);
            return this.localDataManager?.getUserPreferences() || {};
        }
    }
    
    // 로컬 데이터를 클라우드로 동기화
    async syncLocalToCloud() {
        if (!this.isOnline || !this.localDataManager) return;
        
        try {
            // 로컬 운동 기록 동기화
            const localRecords = this.localDataManager.getWorkoutRecords();
            for (const record of localRecords) {
                if (!record.synced) {
                    await this.saveWorkoutRecord({...record, synced: true});
                }
            }
            
            // 로컬 개인 기록 동기화
            const localPRs = this.localDataManager.getPersonalRecords();
            for (const [exercise, record] of Object.entries(localPRs)) {
                await this.savePersonalRecord(exercise, record);
            }
            
            console.log('로컬 데이터 동기화 완료');
        } catch (error) {
            console.error('데이터 동기화 실패:', error);
        }
    }
    
    // 실시간 데이터 변화 감지
    subscribeToWorkoutRecords(callback) {
        if (!this.isOnline) return null;
        
        try {
            const userId = this.getUserId();
            const q = query(
                collection(db, 'workoutRecords'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            
            return onSnapshot(q, (querySnapshot) => {
                const records = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    records.push({
                        ...data,
                        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
                        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
                    });
                });
                callback(records);
            });
        } catch (error) {
            console.error('실시간 구독 실패:', error);
            return null;
        }
    }
    
    // 1RM 계산
    calculateOneRM(weight, reps) {
        if (reps === 1) return weight;
        return Math.round(weight * (1 + (reps / 30)));
    }
    
    // 운동별 진행 상황 분석
    async analyzeProgress(exercise, days = 30) {
        const records = await this.getWorkoutRecords();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const exerciseRecords = records.filter(record => 
            record.exercise === exercise && 
            new Date(record.date) >= cutoffDate
        );
        
        if (exerciseRecords.length === 0) return null;
        
        const weights = exerciseRecords.map(r => r.weight);
        const oneRMs = exerciseRecords.map(r => this.calculateOneRM(r.weight, r.reps));
        
        return {
            totalSessions: exerciseRecords.length,
            avgWeight: weights.reduce((a, b) => a + b, 0) / weights.length,
            maxWeight: Math.max(...weights),
            maxOneRM: Math.max(...oneRMs),
            progressTrend: this.calculateTrend(oneRMs)
        };
    }
    
    // 진행 트렌드 계산
    calculateTrend(values) {
        if (values.length < 2) return 'insufficient_data';
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const improvement = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        if (improvement > 5) return 'improving';
        if (improvement < -5) return 'declining';
        return 'stable';
    }
}

// 전역에서 사용할 수 있도록 export
window.CloudDataManager = CloudDataManager;
export default CloudDataManager;