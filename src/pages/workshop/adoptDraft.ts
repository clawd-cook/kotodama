import { Modal, message } from 'antd';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useEditor } from '../../editor/EditorState';
import { isCurrentPage } from '../../editor/storage';

export function useAdoptDraft() {
  const { snapshot, loadPage, bumpThread } = useEditor();
  const navigate = useNavigate();

  return useCallback(
    (messages: unknown) => {
      const apply = () => {
        const error = loadPage(JSON.stringify(messages));
        if (error) {
          void message.error(error);
          return;
        }
        bumpThread();
        navigate('/');
      };

      if (isCurrentPage(snapshot)) {
        Modal.confirm({
          title: '换上这一页？当前页会被盖掉。',
          okText: '换上',
          cancelText: '留下',
          onOk: apply,
        });
        return;
      }
      apply();
    },
    [bumpThread, loadPage, navigate, snapshot],
  );
}
