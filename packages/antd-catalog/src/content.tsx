import { createComponentImplementation } from '@a2ui/react/v0_9';
import {
  AudioPlayerApi,
  IconApi,
  ImageApi,
  TextApi,
  VideoApi,
} from '@a2ui/web_core/v0_9/basic_catalog';
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Image, Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { weightStyle } from './style';

const ICON_MAP: Record<string, ReactNode> = {
  accountCircle: <UserOutlined />,
  add: <PlusOutlined />,
  close: <CloseOutlined />,
  delete: <DeleteOutlined />,
  edit: <EditOutlined />,
  help: <QuestionCircleOutlined />,
  home: <HomeOutlined />,
  info: <InfoCircleOutlined />,
  mail: <MailOutlined />,
  search: <SearchOutlined />,
  settings: <SettingOutlined />,
  star: <StarOutlined />,
  person: <UserOutlined />,
};

export const Text = createComponentImplementation(TextApi, ({ props }) => {
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
  ImageApi,
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

export const Icon = createComponentImplementation(IconApi, ({ props }) => {
  if (
    typeof props.name === 'object' &&
    props.name !== null &&
    'svgPath' in props.name
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={20}
        height={20}
        role="img"
        aria-label="icon"
        style={weightStyle(props.weight)}
      >
        <title>icon</title>
        <path
          d={(props.name as { svgPath: string }).svgPath}
          fill="currentColor"
        />
      </svg>
    );
  }
  const name = typeof props.name === 'string' ? props.name : '';
  return (
    <span style={weightStyle(props.weight)}>
      {ICON_MAP[name] ?? <QuestionCircleOutlined />}
    </span>
  );
});

export const Video = createComponentImplementation(VideoApi, ({ props }) => (
  // biome-ignore lint/a11y/useMediaCaption: A2UI schema has no caption track
  <video
    src={props.url}
    controls
    style={{ width: '100%', ...weightStyle(props.weight) }}
  />
));

export const AudioPlayer = createComponentImplementation(
  AudioPlayerApi,
  ({ props }) => (
    <div style={weightStyle(props.weight)}>
      {props.description ? (
        <Typography.Text type="secondary">{props.description}</Typography.Text>
      ) : null}
      {/* biome-ignore lint/a11y/useMediaCaption: A2UI schema has no caption track */}
      <audio src={props.url} controls style={{ width: '100%' }} />
    </div>
  ),
);
