import { createComponentImplementation } from '@a2ui/react/v0_9';
import {
  AudioPlayerApi,
  IconApi,
  ImageApi,
  TextApi,
  VideoApi,
} from '@a2ui/web_core/v0_9/basic_catalog';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BellOutlined,
  CalendarOutlined,
  CameraOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FolderOutlined,
  HeartOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LockOutlined,
  MailOutlined,
  MenuOutlined,
  PauseOutlined,
  PhoneOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SendOutlined,
  SettingOutlined,
  ShareAltOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  StopOutlined,
  UnlockOutlined,
  UploadOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Card, Image, Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { antdApi } from './api';
import { weightStyle } from './style';

const ICON_MAP: Record<string, ReactNode> = {
  accountCircle: <UserOutlined />,
  add: <PlusOutlined />,
  arrowBack: <ArrowLeftOutlined />,
  arrowForward: <ArrowRightOutlined />,
  calendarToday: <CalendarOutlined />,
  camera: <CameraOutlined />,
  check: <CheckOutlined />,
  close: <CloseOutlined />,
  delete: <DeleteOutlined />,
  download: <DownloadOutlined />,
  edit: <EditOutlined />,
  error: <CloseCircleOutlined />,
  event: <CalendarOutlined />,
  favorite: <HeartOutlined />,
  folder: <FolderOutlined />,
  help: <QuestionCircleOutlined />,
  home: <HomeOutlined />,
  info: <InfoCircleOutlined />,
  lock: <LockOutlined />,
  lockOpen: <UnlockOutlined />,
  mail: <MailOutlined />,
  menu: <MenuOutlined />,
  notifications: <BellOutlined />,
  pause: <PauseOutlined />,
  person: <UserOutlined />,
  phone: <PhoneOutlined />,
  play: <PlayCircleOutlined />,
  search: <SearchOutlined />,
  send: <SendOutlined />,
  settings: <SettingOutlined />,
  share: <ShareAltOutlined />,
  shoppingCart: <ShoppingCartOutlined />,
  star: <StarOutlined />,
  stop: <StopOutlined />,
  upload: <UploadOutlined />,
  visibility: <EyeOutlined />,
  visibilityOff: <EyeInvisibleOutlined />,
  warning: <WarningOutlined />,
};

export const Text = createComponentImplementation(antdApi(TextApi), ({ props }) => {
  const text =
    typeof props.text === 'string' ? props.text : String(props.text ?? '');
  const style = weightStyle(props.weight);
  switch (props.variant) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
      return (
        <Typography.Title
          level={Number(props.variant.slice(1)) as 1 | 2 | 3 | 4 | 5}
          style={style}
        >
          {text}
        </Typography.Title>
      );
    case 'caption':
      return (
        <Typography.Text type="secondary" style={style}>
          {text}
        </Typography.Text>
      );
    default:
      return <Typography.Text style={style}>{text}</Typography.Text>;
  }
});

export const ImageView = createComponentImplementation(
  antdApi(ImageApi),
  ({ props }) => {
    const fit =
      props.fit === 'scaleDown'
        ? 'scale-down'
        : (props.fit as CSSProperties['objectFit']) || 'fill';
    const style: CSSProperties = {
      ...weightStyle(props.weight),
      objectFit: fit,
    };
    if (props.variant === 'icon') {
      style.width = 24;
      style.height = 24;
    } else if (props.variant === 'avatar') {
      style.width = 40;
      style.height = 40;
      style.borderRadius = '50%';
    } else if (props.variant === 'smallFeature') {
      style.maxWidth = 100;
    } else if (props.variant === 'header') {
      style.height = 200;
      style.objectFit = 'cover';
    }
    return (
      <Image
        src={props.url}
        alt={props.description || ''}
        style={style}
        preview={false}
      />
    );
  },
);

export const Icon = createComponentImplementation(antdApi(IconApi), ({ props }) => {
  if (
    typeof props.name === 'object' &&
    props.name !== null &&
    'svgPath' in props.name
  ) {
    return (
      <Typography.Text style={weightStyle(props.weight)}>
        <svg
          viewBox="0 0 24 24"
          width={20}
          height={20}
          role="img"
          aria-label="icon"
        >
          <title>icon</title>
          <path
            d={(props.name as { svgPath: string }).svgPath}
            fill="currentColor"
          />
        </svg>
      </Typography.Text>
    );
  }
  const name = typeof props.name === 'string' ? props.name : '';
  return (
    <Typography.Text style={weightStyle(props.weight)}>
      {ICON_MAP[name] ?? <ExclamationCircleOutlined />}
    </Typography.Text>
  );
});

export const Video = createComponentImplementation(antdApi(VideoApi), ({ props }) => (
  <Card
    size="small"
    styles={{ body: { padding: 0 } }}
    style={weightStyle(props.weight)}
  >
    {/* biome-ignore lint/a11y/useMediaCaption: A2UI schema has no caption track */}
    <video src={props.url} controls style={{ width: '100%', display: 'block' }} />
  </Card>
));

export const AudioPlayer = createComponentImplementation(
  antdApi(AudioPlayerApi),
  ({ props }) => (
    <Card
      size="small"
      title={props.description || undefined}
      style={weightStyle(props.weight)}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: A2UI schema has no caption track */}
      <audio src={props.url} controls style={{ width: '100%' }} />
    </Card>
  ),
);
