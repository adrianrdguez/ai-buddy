export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Second Brain API',
    version: '1.0.0',
    description: 'API for summarizing web pages and storing them in your second brain'
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    }
  ],
  paths: {
    '/': {
      get: {
        summary: 'Health check endpoint',
        responses: {
          '200': {
            description: 'Server is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Second Brain API is running!'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/summarize': {
      post: {
        summary: 'Summarize web page content',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  url: {
                    type: 'string',
                    example: 'https://example.com'
                  },
                  title: {
                    type: 'string',
                    example: 'Example Article'
                  },
                  content: {
                    type: 'string',
                    example: 'Article content to summarize...'
                  },
                  timeSpent: {
                    type: 'number',
                    example: 120
                  },
                  scrollDepth: {
                    type: 'number',
                    example: 0.8
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successfully summarized content',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    summary: {
                      type: 'string',
                      example: '• Point 1\n• Point 2\n• Point 3...'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'No content provided.'
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'Summarization failed.'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}; 