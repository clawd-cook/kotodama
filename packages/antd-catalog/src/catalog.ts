import type { ReactComponentImplementation } from '@a2ui/react/v0_9';
import { Catalog } from '@a2ui/web_core/v0_9';
import { BASIC_FUNCTIONS } from '@a2ui/web_core/v0_9/basic_catalog';
import { AudioPlayer, Icon, ImageView, Text, Video } from './content';
import {
  ButtonView,
  CheckBox,
  ChoicePicker,
  DateTimeInput,
  SliderView,
  TextField,
} from './input';
import {
  Card,
  Column,
  DividerView,
  List,
  ModalView,
  Row,
  TabsView,
} from './layout';
import { BASIC_CATALOG_ID } from './catalogId';

export { BASIC_CATALOG_ID };

const components: ReactComponentImplementation[] = [
  Text,
  ImageView,
  Icon,
  Video,
  AudioPlayer,
  Row,
  Column,
  List,
  Card,
  TabsView,
  DividerView,
  ModalView,
  ButtonView,
  TextField,
  CheckBox,
  ChoicePicker,
  SliderView,
  DateTimeInput,
];

export const antdCatalog = new Catalog<ReactComponentImplementation>(
  BASIC_CATALOG_ID,
  components,
  BASIC_FUNCTIONS,
);

export const catalogComponents = components;
