// Firebase Cloud Data Manager (Compat 버전)
class CloudDataManager {
    constructor() {
        this.currentUser = null;
        this.isOnline = navigator.onLine;
        this.localDataManager = null;
        this.db = window.db;
        this.auth = window.auth;
        
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncLocalToCloud();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        // 인증 상태 변화 감지
        if (this.auth) {
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    console.log('사용자 로그인됨:', user.uid);
                    this.syncLocalToCloud();
                } else {
                    console.log('사용자 로그아웃됨');
                }
            });
        }
    }
    
    // 로컬 데이터 매니저 설정 (백업용)
    setLocalDataManager(localManager) {
        this.localDataManager = localManager;
    }
    
    // Google 로그인
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await this.auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            console.error('Google 로그인 실패:', error);
            throw error;
        }
    }
    
    // 익명 로그인
    async signInAnonymously() {
        try {
            const result = await this.auth.signInAnonymously();
            return result.user;
        } catch (error) {
            console.error('익명 로그인 실패:', error);
            throw error;
        }
    }
    
    // 로그아웃
    async signOutUser() {
        try {
            await this.auth.signOut();
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
        if (!this.isOnline || !this.db) {
            // 오프라인일 때는 로컬에 저장
            return this.localDataManager?.addWorkoutRecord([record]);
        }
        
        try {
            const userId = this.getUserId();
            const recordId = record.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const recordWithTimestamp = {
                ...record,
                id: recordId,
                userId: userId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection('workoutRecords').doc(recordId).set(recordWithTimestamp);
            
            console.log('운동 기록 저장됨:', recordId);
            return recordWithTimestamp;
        } catch (error) {
            console.error('운동 기록 저장 실패:', error);
            // 실패 시 로컬에 저장
            return this.localDataManager?.addWorkoutRecord([record]);
        }
    }
    
    // 운동 기록 조회
    async getWorkoutRecords() {
        if (!this.isOnline || !this.db) {
            return this.localDataManager?.getWorkoutRecords() || [];
        }
        
        try {
            const userId = this.getUserId();
            const querySnapshot = await this.db.collection('workoutRecords')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const records = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                records.push({
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
                    updatedAt: data.updatedAt?.toDate() || new Date(data.updatedAt)
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
        if (!this.isOnline || !this.db) {
            return this.localDataManager?.updatePersonalRecord?.(exercise, record);
        }
        
        try {
            const userId = this.getUserId();
            const recordId = `${userId}_${exercise.replace(/\s+/g, '_')}`;
            
            const personalRecord = {
                userId: userId,
                exercise: exercise,
                ...record,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection('personalRecords').doc(recordId).set(personalRecord);
            
            console.log('개인 기록 저장됨:', exercise);
            return personalRecord;
        } catch (error) {
            console.error('개인 기록 저장 실패:', error);
            return this.localDataManager?.updatePersonalRecord?.(exercise, record);
        }
    }
    
    // 개인 기록 조회
    async getPersonalRecords() {
        if (!this.isOnline || !this.db) {
            return this.localDataManager?.getPersonalRecords() || {};
        }
        
        try {
            const userId = this.getUserId();
            const querySnapshot = await this.db.collection('personalRecords')
                .where('userId', '==', userId)
                .get();
            
            const records = {};
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                records[data.exercise] = {
                    weight: data.weight,
                    reps: data.reps,
                    date: data.updatedAt?.toDate() || new Date(data.updatedAt)
                };
            });
            
            return records;
        } catch (error) {
            console.error('개인 기록 조회 실패:', error);
            return this.localDataManager?.getPersonalRecords() || {};
        }
    }
    
    // 로컬 데이터를 클라우드로 동기화
    async syncLocalToCloud() {
        if (!this.isOnline || !this.localDataManager || !this.db) return;
        
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
    
    // 1RM 계산
    calculateOneRM(weight, reps) {
        if (reps === 1) return weight;
        return Math.round(weight * (1 + (reps / 30)));
    }
}

// 전역에서 사용할 수 있도록 export
window.CloudDataManager = CloudDataManager;