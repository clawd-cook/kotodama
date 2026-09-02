import { createComponentImplementation } from '@a2ui/react/v0_9';
import {
  ButtonApi,
  CheckBoxApi,
  ChoicePickerApi,
  DateTimeInputApi,
  SliderApi,
  TextFieldApi,
} from '@a2ui/web_core/v0_9/basic_catalog';
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  InputNumber,
  Radio,
  Slider,
  Space,
  TimePicker,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { weightStyle } from './style';

export const ButtonView = createComponentImplementation(
  ButtonApi,
  ({ props, buildChild }) => {
    const type =
      props.variant === 'primary'
        ? 'primary'
        : props.variant === 'borderless'
          ? 'link'
          : 'default';
    return (
      <Button
        type={type}
        onClick={props.action}
        disabled={props.isValid === false}
        style={weightStyle(props.weight)}
      >
        {props.child ? buildChild(props.child) : null}
      </Button>
    );
  },
);

export const TextField = createComponentImplementation(
  TextFieldApi,
  ({ props }) => {
    const error = props.validationErrors?.[0];
    const common = {
      value: props.value ?? '',
      onChange: (value: string) => props.setValue(value),
      status: error ? ('error' as const) : undefined,
    };

    let control: ReactNode;
    if (props.variant === 'longText') {
      control = (
        <Input.TextArea
          value={common.value}
          status={common.status}
          onChange={(event) => common.onChange(event.target.value)}
          rows={4}
        />
      );
    } else if (props.variant === 'number') {
      control = (
        <InputNumber
          style={{ width: '100%' }}
          value={common.value === '' ? undefined : Number(common.value)}
          status={common.status}
          onChange={(value) =>
            common.onChange(value === null ? '' : String(value))
          }
        />
      );
    } else if (props.variant === 'obscured') {
      control = (
        <Input.Password
          value={common.value}
          status={common.status}
          onChange={(event) => common.onChange(event.target.value)}
        />
      );
    } else {
      control = (
        <Input
          value={common.value}
          status={common.status}
          onChange={(event) => common.onChange(event.target.value)}
        />
      );
    }

    return (
      <div style={weightStyle(props.weight)}>
        {props.label ? <Typography.Text>{props.label}</Typography.Text> : null}
        {control}
        {error ? (
          <Typography.Text type="danger">{error}</Typography.Text>
        ) : null}
      </div>
    );
  },
);

export const CheckBox = createComponentImplementation(
  CheckBoxApi,
  ({ props }) => (
    <div style={weightStyle(props.weight)}>
      <Checkbox
        checked={!!props.value}
        onChange={(event) => props.setValue(event.target.checked)}
      >
        {props.label}
      </Checkbox>
      {props.validationErrors?.[0] ? (
        <Typography.Text type="danger">
          {props.validationErrors[0]}
        </Typography.Text>
      ) : null}
    </div>
  ),
);

export const ChoicePicker = createComponentImplementation(
  ChoicePickerApi,
  ({ props }) => {
    const values = Array.isArray(props.value) ? props.value : [];
    const options = (props.options ?? []).map((opt) => ({
      label: typeof opt.label === 'string' ? opt.label : String(opt.value),
      value: opt.value,
    }));

    return (
      <Space direction="vertical" style={weightStyle(props.weight)}>
        {props.label ? <Typography.Text>{props.label}</Typography.Text> : null}
        {props.variant === 'mutuallyExclusive' ? (
          <Radio.Group
            value={values[0]}
            options={options}
            onChange={(event) => props.setValue([event.target.value])}
          />
        ) : (
          <Checkbox.Group
            value={values}
            options={options}
            onChange={(next) => props.setValue(next as string[])}
          />
        )}
      </Space>
    );
  },
);

export const SliderView = createComponentImplementation(
  SliderApi,
  ({ props }) => (
    <div style={weightStyle(props.weight)}>
      {props.label ? <Typography.Text>{props.label}</Typography.Text> : null}
      <Slider
        min={props.min ?? 0}
        max={props.max}
        value={props.value ?? 0}
        onChange={(value) => props.setValue(value)}
      />
    </div>
  ),
);

export const DateTimeInput = createComponentImplementation(
  DateTimeInputApi,
  ({ props }) => {
    if (!props.enableDate && !props.enableTime) {
      return null;
    }
    const value = props.value ? dayjs(props.value) : null;
    const parsed = value?.isValid() ? value : null;
    return (
      <div style={weightStyle(props.weight)}>
        {props.label ? <Typography.Text>{props.label}</Typography.Text> : null}
        {props.enableDate && props.enableTime ? (
          <DatePicker
            showTime
            value={parsed}
            onChange={(next) => props.setValue(next ? next.toISOString() : '')}
          />
        ) : props.enableDate ? (
          <DatePicker
            value={parsed}
            onChange={(next) =>
              props.setValue(next ? next.format('YYYY-MM-DD') : '')
            }
          />
        ) : (
          <TimePicker
            value={parsed}
            onChange={(next) =>
              props.setValue(next ? next.format('HH:mm:ss') : '')
            }
          />
        )}
      </div>
    );
  },
);
