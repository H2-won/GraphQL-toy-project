import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import MsgItem from './MsgItem';
import MsgInput from './MsgInput';
import { fetcher, QueryKeys } from '../queryClient';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { CREATE_MESSAGE, DELETE_MESSAGE, GET_MESSAGES, UPDATE_MESSAGE } from '../graphql/messages';
// import useInfiniteScroll from '../hooks/useInfiniteScroll';

const MsgList = ({ smsgs, users }) => {
  const client = useQueryClient();
  const { query } = useRouter();
  // window에서 query string을 소문자로 바꾸는 case issue 대응
  const userId = query.userId || query.userid || '';
  const [msgs, setMsgs] = useState(smsgs);
  const [editingId, setEditingId] = useState(null);
  // 최하단에서 더 불러올 정보가 없다면 불필요한 fetch 요청을 안하기 위해 hasNext를 통해 관리
  // const [hasNext, setHasNext] = useState(true);
  // const fetchMoreEl = useRef(null);
  // const intersecting = useInfiniteScroll(fetchMoreEl);

  const { mutate: onCreate } = useMutation(({ text }) => fetcher(CREATE_MESSAGE, { text, userId }), {
    onSuccess: ({ createMessage }) => {
      client.setQueryData(QueryKeys.MESSAGES, (old) => {
        return {
          messages: [createMessage, ...old.messages],
        };
      });
    },
  });

  const { mutate: onUpdate } = useMutation(({ text, id }) => fetcher(UPDATE_MESSAGE, { text, id, userId }), {
    onSuccess: ({ updateMessage }) => {
      client.setQueryData(QueryKeys.MESSAGES, (old) => {
        const targetIndex = old.messages.findIndex((msg) => msg.id === updateMessage.id);
        if (targetIndex < 0) return old;
        const newMsgs = [...old.messages];
        newMsgs.splice(targetIndex, 1, updateMessage);
        return { messages: newMsgs };
      });
      doneEdit();
    },
  });

  const { mutate: onDelete } = useMutation((id) => fetcher(DELETE_MESSAGE, { id, userId }), {
    onSuccess: ({ deleteMessage: deletedId }) => {
      client.setQueryData(QueryKeys.MESSAGES, (old) => {
        const targetIndex = old.messages.findIndex((msg) => msg.id === deletedId);
        if (targetIndex < 0) return old;
        const newMsgs = [...old.messages];
        newMsgs.splice(targetIndex, 1);
        return { messages: newMsgs };
      });
      doneEdit();
    },
  });

  const doneEdit = () => setEditingId(null);

  const { data, error, isError } = useQuery(QueryKeys.MESSAGES, () => fetcher(GET_MESSAGES));

  useEffect(() => {
    if (!data?.messages) return;
    console.log('msgs changed');
    setMsgs(data?.messages || []);
  }, [data?.messages]);

  if (isError) {
    console.error(error);
    return null;
  }

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
            users={users}
          />
        ))}
      </ul>
      {/* <div ref={fetchMoreEl} /> */}
    </>
  );
};

export default MsgList;
