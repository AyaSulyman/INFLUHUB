module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'InfluHub API Documentation',
    version: '1.0.0',
    description: 'Comprehensive API documentation for InfluHub platform',
    contact: {
      name: 'API Support',
      email: 'support@influhub.com'
    }
  },
  servers: [
    {
      url: 'http://influhub-1.onrender.com',
      description: 'Local development server'
    },
    {
      url: 'https://influhub-1.onrender.com',
      description: 'Production server'
    }
  ],
  tags: [
    { name: 'Authentication', description: 'User  authentication endpoints' },
    { name: 'User ', description: 'User  management endpoints' },
    { name: 'Messages', description: 'Message handling endpoints' },
    { name: 'Profile', description: 'User  profile management' },
    { name: 'Dashboard', description: 'Dashboard related endpoints' },
    { name: 'Address', description: 'Address management endpoints' },
    { name: 'Capitals', description: 'Capitals management endpoints' },
    { name: 'Degrees', description: 'Degrees management endpoints' },
    { name: 'Industries', description: 'Industries management endpoints' }
  ],
  paths: {
    '/message': {
      post: {
        tags: ['Messages'],
        summary: 'Create a new message',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: {
                    type: 'string',
                    example: 'Hello, this is a message.'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Message created successfully'
          },
          400: {
            description: 'Bad request'
          }
        }
      },
      get: {
        tags: ['Messages'],
        summary: 'Get all messages',
        responses: {
          200: {
            description: 'List of all messages'
          },
          400: {
            description: 'Bad request'
          }
        }
      }
    },
    '/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['Email', 'Password', 'ConfirmPassword'],
                properties: {
                  Email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  Password: {
                    type: 'string',
                    format: 'password',
                    example: 'password123'
                  },
                  ConfirmPassword: {
                    type: 'string',
                    format: 'password',
                    example: 'password123'
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'User  registered successfully, OTP sent to email'
            },
            400: {
              description: 'Invalid input or email already exists'
            }
          }
        }
      }
    },
    '/verify-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify OTP for account activation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['Email', 'otp'],
                properties: {
                  Email: {
                    type: 'string',
                    example: 'user@example.com'
                  },
                  otp: {
                    type: 'string',
                    example: '123456'
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'OTP verified successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                      },
                      refreshToken: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                      }
                    }
                  }
                }
              }
            },
            400: {
              description: 'Invalid or expired OTP'
            }
          }
        }
      }
    },
    '/resend-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Resend OTP to the user email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  Email: {
                    type: 'string',
                    example: 'user@example.com'
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'OTP has been resent to your email'
            },
            404: {
              description: 'User  not found'
            },
            500: {
              description: 'Failed to resend OTP'
            }
          }
        }
      }
    },
    '/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User  login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'Password'],
                properties: {
                  username: {
                    type: 'string',
                    example: 'user123'
                  },
                  Password: {
                    type: 'string',
                    example: 'password123'
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'User  logged in successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          username: { type: 'string' },
                          email: { type: 'string' }
                        }
                      },
                      token: { type: 'string' }
                    }
                  }
                }
              }
            },
            404: {
              description: 'Invalid credentials'
            },
            500: {
              description: 'Internal server error'
            }
          }
        }
      }
    },
    '/profile-onboarding-submit': {
      post: {
        tags: ['Profile'],
        summary: 'Submit user profile onboarding data',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'userType', 'CountryCode', 'PhoneNumber'],
                properties: {
                  email: { type: 'string', example: 'user@example.com' },
                  username: { type: 'string', example: 'user123' },
                  CountryCode: { type: 'string', example: '+1' },
                  PhoneNumber: { type: 'string', example: '1234567890' },
                  userType: { type: 'string', enum: ['Retailer', 'Supplier'] },
                  Industry: { type: 'string', example: 'Technology' },
                  Degree: { type: 'string', example: 'Bachelor' },
                  isFreelancer: { type: 'boolean', example: true },
                  Type: { type: 'string', example: 'Type A' },
                  Capital: { type: 'string', example: '10000' },
                  DigitalPresence: { type: 'string', example: 'website.com' }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Profile updated successfully'
            },
            400: {
              description: 'All required fields must be filled'
            },
            404: {
              description: 'User  not found'
            },
            500: {
              description: 'Internal server error'
            }
          }
        }
      }
    },
    '/check-username': {
      post: {
        tags: ['User '],
        summary: 'Check if a username is available',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string',
                    example: 'user123'
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Username is available'
            },
            400: {
              description: 'Username is required or already exists'
            }
          }
        }
      }
    },
    '/industries': {
      get: {
        tags: ['Profile'],
        summary: 'Get list of industries',
        responses: {
          200: {
            description: 'List of industries',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          },
          500: {
            description: 'Failed to load industries'
          }
        }
      },
      put: {
        tags: ['Profile'],
        summary: 'Update industries',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  carousel: {
                    type: 'array',
                    items: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Industries updated successfully'
            },
            400: {
              description: 'Invalid data format for industries'
            },
            500: {
              description: 'Failed to update industries'
            }
          }
        }
      }
    },
    '/capitals': {
      get: {
        tags: ['Profile'],
        summary: 'Get list of capitals',
        responses: {
          200: {
            description: 'List of capitals',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          },
          500: {
            description: 'Failed to load capitals'
          }
        }
      },
      put: {
        tags: ['Profile'],
        summary: 'Update capitals',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Capitals updated successfully'
            },
            400: {
              description: 'Invalid data format for capitals'
            },
            500: {
              description: 'Failed to update capitals'
            }
          }
        }
      }
    },
    '/degrees': {
      get: {
        tags: ['Profile'],
        summary: 'Get list of degrees',
        responses: {
          200: {
            description: 'List of degrees',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          },
          500: {
            description: 'Failed to load degrees'
          }
        }
      },
      put: {
        tags: ['Profile'],
        summary: 'Update degrees',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Degrees updated successfully'
            },
            400: {
              description: 'Invalid data format for degrees'
            },
            500: {
              description: 'Failed to update degrees'
            }
          }
        }
      }
    },
    '/supplier-service': {
      post: {
        tags: ['Dashboard'],
        summary: 'Get suppliers based on industry',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    example: 'userId123'
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'List of suppliers based on industry'
            },
            400: {
              description: 'userId is required'
            },
            404: {
              description: 'User  not found'
            },
            403: {
              description: 'Access denied'
            },
            500: {
              description: 'Internal server error'
            }
          }
        }
      }
    },
    '/retailer/dashboard': {
      post: {
        tags: ['Dashboard'],
        summary: 'Get retailer dashboard data',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    example: 'userId123'
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Retailer dashboard data'
            },
            400: {
              description: 'User  Id is required'
            },
            403: {
              description: 'Access denied'
            },
            500: {
              description: 'Internal server error'
            }
          }
        }
      }
    },
    '/supplier/dashboard': {
      post: {
        tags: ['Dashboard'],
        summary: 'Get supplier dashboard data',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    example: 'userId123'
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Supplier dashboard data'
            },
            400: {
              description: 'User  Id is required'
            },
            403: {
              description: 'Access denied'
            },
            500: {
              description: 'Internal server error'
            }
          }
        }
      }
    },
    '/updating-profile': {
      post: {
        tags: ['Profile'],
        summary: 'Update user profile',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary'
                  },
                  firstName: {
                    type: 'string',
                    example: 'John'
                  },
                  lastName: {
                    type: 'string',
                    example: 'Doe'
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Profile updated successfully'
            },
            400: {
              description: 'User  ID is required or image file is missing'
            },
            404: {
              description: 'User  not found'
            },
            500: {
              description: 'Internal server error'
            }
          }
        }
      }
    },
    '/change-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Change user password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['oldPassword', 'newPassword'],
                properties: {
                  oldPassword: {
                    type: 'string',
                    example: 'oldpassword123'
                  },
                  newPassword: {
                    type: 'string',
                    example: 'newpassword123'
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Password changed successfully'
            },
            400: {
              description: 'Both old and new passwords are required'
            },
            403: {
              description: 'Old password is incorrect'
            },
            404: {
              description: 'User  not found'
            },
            500: {
              description: 'Internal server error'
            }
          }
        }
      }
    },
    '/addresses': {
      post: {
        tags: ['Address'],
        summary: 'Add a new address',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nickname', 'street', 'phone_number', 'latitude', 'longitude'],
                properties: {
                  nickname: { type: 'string', example: 'Home' },
                  street: { type: 'string', example: '123 Main St' },
                  building: { type: 'string', example: 'Building A' },
                  apartment: { type: 'string', example: 'Apt 1' },
                  phone_number: { type: 'string', example: '1234567890' },
                  latitude: { type: 'number', example: 40.7128 },
                  longitude: { type: 'number', example: -74.0060 }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Address added successfully'
            },
            400: {
              description: 'Validation failed'
            },
            500: {
              description: 'An error occurred while adding the address'
            }
          }
        }
      }
    },
    '/all-addresses': {
      get: {
        tags: ['Address'],
        summary: 'Get all addresses',
        responses: {
          200: {
            description: 'List of all addresses',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      nickname: { type: 'string' },
                      street: { type: 'string' },
                      building: { type: 'string' },
                      apartment: { type: 'string' },
                      phone_number: { type: 'string' },
                      latitude: { type: 'number' },
                      longitude: { type: 'number' }
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'No addresses found'
          },
          500: {
            description: 'Service error occurred'
          }
        }
      }
    },
    '/address/{id}': {
      put: {
        tags: ['Address'],
        summary: 'Update a specific address',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Address ID',
            schema: {
              type: 'string'
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  street: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  zipCode: { type: 'string' },
                  country: { type: 'string' }
                }
              }
            }
          },
          responses: {
             200: {
              description: 'Address updated successfully'
            },
            404: {
              description: 'Address not found'
            },
            500: {
              description: 'Failed to update address'
            }
          }
        }
      },
      delete: {
        tags: ['Address'],
        summary: 'Delete a specific address',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Address ID',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          200: {
            description: 'Address deleted successfully'
          },
          404: {
            description: 'Address not found'
          },
          500: {
            description: 'Failed to delete address'
          }
        }
      }
    },
    '/change-language': {
      post: {
        tags: ['Profile'],
        summary: 'Change user language preference',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['language'],
                properties: {
                  language: {
                    type: 'string',
                    enum: ['en', 'ar', 'fr'],
                    example: 'en'
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Language updated successfully'
            },
            400: {
              description: 'Invalid language code'
            },
            404: {
              description: 'User  not found'
            },
            500: {
              description: 'Internal server error'
            }
          }
        }
      }
    },

    '/retailer/competitors': {
      post: {
        tags: ['Dashboard'],
        summary: 'Get competitors for retailers',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    example: 'userId123'
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'List of competitors for retailers'
            },
            400: {
              description: 'User  ID is required'
            },
            403: {
              description: 'Access denied'
            },
            500: {
              description: 'Internal server error'
            }
          }
        }
      }
    },

    '/supplier/competitors': {
      post: {
        tags: ['Dashboard'],
        summary: 'Get competitors for suppliers',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    example: 'userId123'
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'List of competitors for suppliers'
            },
            400: {
              description: 'User  ID is required'
            },
            403: {
              description: 'Access denied'
            },
            500: {
              description: 'Internal server error'
            }
          }
        }
      }
    }
 
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }

};