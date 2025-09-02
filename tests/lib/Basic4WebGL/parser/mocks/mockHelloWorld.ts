export default {
  type: 1,
  data: 'main',
  children: [
    {
      type: 5,
      data: null,
      children: [
        {
          type: 4,
          data: '"Hello, World!"',
          children: [
            {
              type: 9,
              data: '"Hello, World!"',
              children: [],
              dataType: {
                name: 'String',
                acceptsTypes: ['String', 'Variant'],
              },
            },
          ],
          dataType: {
            name: 'String',
            acceptsTypes: ['String', 'Variant'],
          },
        },
      ],
      dataType: {
        name: 'Unknown',
        acceptsTypes: ['Unknown'],
      },
    },
  ],
  dataType: {
    name: 'Unknown',
    acceptsTypes: ['Unknown'],
  },
};
