import { Modal, message } from 'antd';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useEditor } from '../../editor/EditorState';
import { isCurrentPage } from '../../editor/storage';
import { createRoom } from '../../studio/rooms';
import { useStudioSession } from '../../studio/StudioSession';

export function useAdoptDraft() {
  const { snapshot, loadPage } = useEditor();
  const { markVisitedWorkshop, bumpThread } = useStudioSession();
  const navigate = useNavigate();
  const workshop = createRoom();

  return useCallback(
    (messages: unknown) => {
      const apply = () => {
        const error = loadPage(JSON.stringify(messages));
        if (error) {
          void message.error(error);
          return;
        }
        markVisitedWorkshop();
        bumpThread();
        navigate(workshop.path);
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
    [
      bumpThread,
      loadPage,
      markVisitedWorkshop,
      navigate,
      snapshot,
      workshop.path,
    ],
  );
}
