module.exports = async function handler(req, res) {
  // 🌟 CORS 설정: 다른 도메인에서도 API 호출 가능하도록 허용
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 🌟 브라우저 사전 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  // 💡 프론트엔드에서 4가지 데이터만 받습니다 (개인정보 동의는 노션에 안 넘김)
  const { name, phone, project, motivation } = req.body;

  const notionApiKey = process.env.NOTION_API_KEY;
  // Vercel 환경변수(NOTION_DATABASE_ID)를 사용하거나, 없을 경우 알려주신 새 ID를 기본값으로 사용
  const databaseId = process.env.NOTION_DATABASE_ID || "327c7b1d26a280459263d769f1735884";

  if (!notionApiKey) {
    return res.status(500).json({ message: '서버 설정 오류: 노션 API 키가 없습니다.' });
  }

  try {
    // 🚀 새 데이터베이스에 새로운 줄(Page) 생성하기
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          "이름": { title: [ { text: { content: name } } ] },
          "연락처": { rich_text: [ { text: { content: phone } } ] },
          "기대 되는 프로젝트": { select: { name: project } },
          "지원 동기": { rich_text: [ { text: { content: motivation } } ] }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Notion API Error:', data);
      return res.status(400).json({ message: '노션 저장 실패: ' + data.message });
    }

    return res.status(200).json({ message: '성공적으로 신청되었습니다.' });
    
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ message: '내부 서버 오류: ' + error.message });
  }
};
