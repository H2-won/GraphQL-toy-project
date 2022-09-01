import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import MsgItem from './MsgItem';
import MsgInput from './MsgInput';
import fetcher from '../fetcher';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const UserIds = ['roy', 'jay'];

const MsgList = () => {
  const { query } = useRouter();
  // window에서 query string을 소문자로 바꾸는 case issue 대응
  const userId = query.userId || query.userid || '';
  const [msgs, setMsgs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  // 최하단에서 더 불러올 정보가 없다면 불필요한 fetch 요청을 안하기 위해 hasNext를 통해 관리
  const [hasNext, setHasNext] = useState(true);
  const fetchMoreEl = useRef(null);
  const intersecting = useInfiniteScroll(fetchMoreEl);

  const onCreate = async (text) => {
    const newMsg = await fetcher('post', '/messages', { text, userId });
    if (!newMsg) throw Error('something wrong');
    setMsgs((msgs) => [newMsg, ...msgs]);
  };

  const onUpdate = async (text, id) => {
    const newMsg = await fetcher('put', `/messages/${id}`, { text, userId });
    if (!newMsg) throw Error('something wrong');
    setMsgs((msgs) => {
      const targetIndex = msgs.findIndex((msg) => msg.id === id);
      if (targetIndex < 0) return msgs;
      const newMsgs = [...msgs];
      newMsgs.splice(targetIndex, 1, newMsg);
      return newMsgs;
    });
    doneEdit();
  };

  const onDelete = async (id) => {
    // client에서 params로 넘기는 값은 server에서 query로 받는 queryString과 같다.
    const receivedId = await fetcher('delete', `/messages/${id}`, { params: { userId } });
    setMsgs((msgs) => {
      // mockData로 생성한 "1" 같은 id 값은 파싱하면서 number로 자동 형변환이 되기 때문에 문자열로 변환해줘야 문제가 없다.
      const targetIndex = msgs.findIndex((msg) => msg.id === receivedId + '');
      if (targetIndex < 0) return msgs;
      const newMsgs = [...msgs];
      newMsgs.splice(targetIndex, 1);
      return newMsgs;
    });
  };

  const doneEdit = () => setEditingId(null);

  const getMessages = async () => {
    const newMsgs = await fetcher('get', '/messages', { params: { cursor: msgs[msgs.length - 1]?.id || '' } });
    if (newMsgs.length === 0) {
      setHasNext(false);
      return;
    }
    setMsgs((msgs) => [...msgs, ...newMsgs]);
  };

  useEffect(() => {
    if (intersecting && hasNext) {
      getMessages();
    }
  }, [intersecting]);

  return (
    <>
      {userId && <MsgInput mutate={onCreate} />}
      <ul className="messages">
        {msgs.map((x) => (
          <MsgItem
            key={x.id}
            {...x}
            onUpdate={onUpdate}
            onDelete={() => onDelete(x.id)}
            startEdit={() => setEditingId(x.id)}
            isEditing={editingId === x.id}
            myId={userId}
          />
        ))}
      </ul>
      <div ref={fetchMoreEl} />
    </>
  );
};

export default MsgList;
