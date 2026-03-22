module.exports = async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  const { gender, goodPoint, badPoint, review } = req.body;

  // 💡 1. 알려주신 구글 폼 주소를 바탕으로 URL을 세팅해 두었습니다!
  const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfKr-3xE4dElJPhOA_8NGTz5sL_HeX1RnWQm8pRIQKuGSGKsg/formResponse";

  // 🚨 2. 아래 "111111111" 등의 숫자를 찾으신 entry. 번호로 바꿔주세요!
  const formData = new URLSearchParams();
  formData.append("entry.1815884272", gender);      // 성별의 entry 번호
  formData.append("entry.1910079443", goodPoint);   // 좋았던 점의 entry 번호
  formData.append("entry.1905868619", badPoint);    // 아쉬웠던 점의 entry 번호
  
  try {
    const response = await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // 구글 폼은 성공 시 HTML을 반환하므로 ok 여부만 체크합니다.
    if (!response.ok) {
      throw new Error('구글 폼 전송 실패');
    }

    return res.status(200).json({ message: '설문이 성공적으로 제출되었습니다.' });
    
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ message: '내부 서버 오류: ' + error.message });
  }
};
