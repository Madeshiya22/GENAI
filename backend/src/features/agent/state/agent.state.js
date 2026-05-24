export const agentState = {
  input: {
    value: (x, y) => y ?? x,

    default: () => "",
  },

  messages: {
    value: (x, y) => y ?? x,

    default: () => [],
  },

  route: {
    value: (x, y) => y ?? x,

    default: () => "",
  },

  response: {
    value: (x, y) => y ?? x,

    default: () => "",
  },

  sources: {
    value: (x, y) => y ?? x,

    default: () => [],
  },

  userId: {
    value: (x, y) => y ?? x,

    default: () => "",
  },

  documentIds: {
    value: (x, y) => y ?? x,

    default: () => [],
  },
};
