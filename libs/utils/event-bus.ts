import mitt from 'mitt';

// For some reason, this has to be a type, not an interface for mitt
// eslint-disable-next-line ts/consistent-type-definitions
type Events = {
  'show-auth': void;
};

export const EventBus = mitt<Events>();
