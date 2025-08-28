// 업데이트된 운동 라이브러리
const EXERCISE_LIBRARY = {
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

// 기존 데이터 매니저에 운동 라이브러리 업데이트 함수
function updateExerciseLibrary(dataManager) {
    const currentExercises = dataManager.getData('exercises') || {};
    
    // 새로운 운동들을 기존 데이터에 병합
    const updatedExercises = { ...currentExercises };
    
    Object.keys(EXERCISE_LIBRARY).forEach(bodyPart => {
        if (!updatedExercises[bodyPart]) {
            updatedExercises[bodyPart] = [];
        }
        
        // 중복 제거하면서 새로운 운동 추가
        EXERCISE_LIBRARY[bodyPart].forEach(exercise => {
            if (!updatedExercises[bodyPart].includes(exercise)) {
                updatedExercises[bodyPart].push(exercise);
            }
        });
    });
    
    dataManager.setData('exercises', updatedExercises);
    console.log('운동 라이브러리가 업데이트되었습니다.');
}

// 전역에서 사용할 수 있도록 export
window.EXERCISE_LIBRARY = EXERCISE_LIBRARY;
window.updateExerciseLibrary = updateExerciseLibrary;

export { EXERCISE_LIBRARY, updateExerciseLibrary };