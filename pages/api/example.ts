import type { NextApiRequest, NextApiResponse } from 'next'

type ApiResponse = {
  success: boolean
  message: string
  data?: any
}

type ErrorResponse = {
  success: false
  error: string
  code?: number
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | ErrorResponse>
) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res)
      case 'POST':
        return handlePost(req, res)
      case 'PUT':
        return handlePut(req, res)
      case 'DELETE':
        return handleDelete(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} Not Allowed`
        })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      code: 500
    })
  }
}

function handleGet(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { id } = req.query
  
  return res.status(200).json({
    success: true,
    message: 'GET request successful',
    data: {
      id: id || 'all',
      timestamp: new Date().toISOString(),
      example: 'This is example data'
    }
  })
}

function handlePost(req: NextApiRequest, res: NextApiResponse<ApiResponse | ErrorResponse>) {
  const { name, email } = req.body
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name and email'
    })
  }
  
  return res.status(201).json({
    success: true,
    message: 'Data created successfully',
    data: {
      id: Date.now(),
      name,
      email,
      createdAt: new Date().toISOString()
    }
  })
}

function handlePut(req: NextApiRequest, res: NextApiResponse<ApiResponse | ErrorResponse>) {
  const { id } = req.query
  const updateData = req.body
  
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'ID is required for update'
    })
  }
  
  return res.status(200).json({
    success: true,
    message: 'Data updated successfully',
    data: {
      id,
      ...updateData,
      updatedAt: new Date().toISOString()
    }
  })
}

function handleDelete(req: NextApiRequest, res: NextApiResponse<ApiResponse | ErrorResponse>) {
  const { id } = req.query
  
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'ID is required for deletion'
    })
  }
  
  return res.status(200).json({
    success: true,
    message: 'Data deleted successfully',
    data: { id, deletedAt: new Date().toISOString() }
  })
}