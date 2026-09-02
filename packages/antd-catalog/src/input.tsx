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
  TimePicker,
} from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { antdApi } from './api';
import { Field } from './Field';
import { weightStyle } from './style';

function extraString(
  props: object,
  key: string,
): string | undefined {
  const value = (props as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

export const ButtonView = createComponentImplementation(
  antdApi(ButtonApi),
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
  antdApi(TextFieldApi),
  ({ props }) => {
    const error = props.validationErrors?.[0];
    const htmlType = extraString(props, 'type');
    const obscured = props.variant === 'obscured' || htmlType === 'password';
    const common = {
      value: props.value ?? '',
      status: error ? ('error' as const) : undefined,
    };

    let control: ReactNode;
    if (props.variant === 'longText') {
      control = (
        <Input.TextArea
          value={common.value}
          status={common.status}
          onChange={(event) => props.setValue(event.target.value)}
          rows={4}
        />
      );
    } else if (props.variant === 'number' || htmlType === 'number') {
      control = (
        <InputNumber
          style={{ width: '100%' }}
          value={common.value === '' ? undefined : Number(common.value)}
          status={common.status}
          onChange={(value) =>
            props.setValue(value === null ? '' : String(value))
          }
        />
      );
    } else if (obscured) {
      control = (
        <Input.Password
          style={{ width: '100%' }}
          value={common.value}
          status={common.status}
          onChange={(event) => props.setValue(event.target.value)}
        />
      );
    } else {
      control = (
        <Input
          style={{ width: '100%' }}
          type={htmlType && htmlType !== 'password' ? htmlType : undefined}
          value={common.value}
          status={common.status}
          onChange={(event) => props.setValue(event.target.value)}
        />
      );
    }

    return (
      <Field label={props.label} error={error} weight={props.weight}>
        {control}
      </Field>
    );
  },
);

export const CheckBox = createComponentImplementation(
  antdApi(CheckBoxApi),
  ({ props }) => (
    <Field error={props.validationErrors?.[0]} weight={props.weight}>
      <Checkbox
        checked={!!props.value}
        onChange={(event) => props.setValue(event.target.checked)}
      >
        {props.label}
      </Checkbox>
    </Field>
  ),
);

export const ChoicePicker = createComponentImplementation(
  antdApi(ChoicePickerApi),
  ({ props }) => {
    const values = Array.isArray(props.value) ? props.value : [];
    const options = (props.options ?? []).map((opt) => ({
      label: typeof opt.label === 'string' ? opt.label : String(opt.value),
      value: opt.value,
    }));

    return (
      <Field label={props.label} error={props.validationErrors?.[0]} weight={props.weight}>
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
      </Field>
    );
  },
);

export const SliderView = createComponentImplementation(
  antdApi(SliderApi),
  ({ props }) => (
    <Field label={props.label} error={props.validationErrors?.[0]} weight={props.weight}>
      <Slider
        min={props.min ?? 0}
        max={props.max}
        value={props.value ?? 0}
        onChange={(value) => props.setValue(value)}
      />
    </Field>
  ),
);

export const DateTimeInput = createComponentImplementation(
  antdApi(DateTimeInputApi),
  ({ props }) => {
    if (!props.enableDate && !props.enableTime) {
      return null;
    }
    const value = props.value ? dayjs(props.value) : null;
    const parsed = value?.isValid() ? value : null;
    let picker: ReactNode;
    if (props.enableDate && props.enableTime) {
      picker = (
        <DatePicker
          showTime
          style={{ width: '100%' }}
          value={parsed}
          onChange={(next) => props.setValue(next ? next.toISOString() : '')}
        />
      );
    } else if (props.enableDate) {
      picker = (
        <DatePicker
          style={{ width: '100%' }}
          value={parsed}
          onChange={(next) =>
            props.setValue(next ? next.format('YYYY-MM-DD') : '')
          }
        />
      );
    } else {
      picker = (
        <TimePicker
          style={{ width: '100%' }}
          value={parsed}
          onChange={(next) =>
            props.setValue(next ? next.format('HH:mm:ss') : '')
          }
        />
      );
    }

    return (
      <Field label={props.label} error={props.validationErrors?.[0]} weight={props.weight}>
        {picker}
      </Field>
    );
  },
);
