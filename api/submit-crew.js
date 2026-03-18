export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  // 프론트엔드에서 간소화된 데이터만 받습니다.
  const { name, phone, track, motivation } = req.body;

  const notionApiKey = process.env.NOTION_API_KEY;
  // ❗ 기존 3/28 행사 신청자를 받았던 데이터베이스 ID를 그대로 사용하세요.
  const databaseId = process.env.NOTION_DATABASE_ID; 

  if (!notionApiKey || !databaseId) {
    return res.status(500).json({ message: '서버 설정 오류' });
  }

  try {
    // 1️⃣ 기존 데이터베이스에서 해당 연락처를 가진 사람 검색 (Query)
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: "연락처",
          rich_text: {
            equals: phone // 폼에서 입력한 연락처와 정확히 일치하는 행 찾기
          }
        }
      })
    });

    const queryData = await queryResponse.json();

    if (!queryResponse.ok) {
      throw new Error('노션 데이터베이스 검색 실패');
    }

    // 일치하는 연락처가 없는 경우 (현장에 예매 없이 온 사람 등)
    if (queryData.results.length === 0) {
      // 필요하다면 새로 생성(POST /pages)하게 할 수도 있지만, 
      // 현재는 "기존 신청자"를 대상으로 하므로 에러를 반환합니다.
      return res.status(404).json({ message: '기존 행사 신청 내역을 찾을 수 없습니다. 연락처를 확인해주세요.' });
    }

    // 2️⃣ 일치하는 데이터가 있다면, 해당 줄의 페이지 ID를 가져와서 덮어쓰기 (Update/Patch)
    const pageId = queryData.results[0].id;

    const updateResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          // 🚨 기존 노션 DB에 "크루 지원", "지원 파트" 컬럼이 미리 만들어져 있어야 합니다.
          "크루 지원": { checkbox: true }, // 지원여부 O 표시 (체크박스)
          "지원 파트": { select: { name: track } },
          "지원 동기": { rich_text: [ { text: { content: motivation } } ] }
        }
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('Update Error:', errorData);
      return res.status(updateResponse.status).json({ message: '노션 업데이트 중 오류 발생' });
    }

    return res.status(200).json({ message: '성공적으로 신청 및 업데이트 되었습니다.' });
    
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ message: '내부 서버 오류' });
  }
}
