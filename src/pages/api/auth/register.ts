import bcrypt from 'bcryptjs'
import db from '../../../libs/db'
import session from '../../../libs/session'

import type { NextApiRequest, NextApiResponse } from 'next'

type Body = {
  role: string
  email: string
  code: string
  name: string
  password: string
  confirmation: string
}

type Verify = {
  code: string
  user: string
  expire: number
}

const ROLE = new Set(['student', 'teacher'])

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<API.BaseResponse>
): Promise<void> => {
  if (req.method === 'POST') {
    const body = req.body
      ? ((typeof req.body === 'string'
          ? JSON.parse(req.body)
          : req.body) as Partial<Body>)
      : undefined

    const { role, email, code, name, password, confirmation } = body ?? {}

    if (
      role === undefined ||
      email === undefined ||
      code === undefined ||
      name === undefined ||
      password === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing information.',
        data: null,
      })
    }

    if (!ROLE.has(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role.',
        data: null,
      })
    }

    if (password !== confirmation) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation does not match.',
        data: null,
      })
    }

    if (password.match($0.regex.password) === null) {
      return res.status(400).json({
        success: false,
        message:
          'Password must contain at least 8 characters, 1 uppercase letter, and 1 lowercase letter.',
        data: null,
      })
    }

    const verify = await db.query<Verify[]>(
      'SELECT * FROM `verification` WHERE `code` = ?',
      code
    )

    if (verify.length === 0 || verify[0].user !== email) {
      db.end()
      return res.status(400).json({
        success: false,
        message: 'Wrong verification code.',
        data: null,
      })
    }

    if (verify[0].expire < Math.floor(Date.now() / 1000)) {
      db.end()
      return res.status(400).json({
        success: false,
        message: 'Code expired.',
        data: null,
      })
    }

    const user = `user_${$0.getRandomId(10)}`

    const hash = await bcrypt.hash(password, 10)

    await db.query(
      'INSERT INTO `user` (`id`, `name`, `email`, `role`) VALUES (?, ?, ?, ?)',
      [user, name, email, role]
    )

    await db.query('INSERT INTO `pass` (`user`, `password`) VALUES (?, ?)', [
      user,
      hash,
    ])

    const sid = await session.create(user)

    db.end()
    res.setHeader('Set-Cookie', session.cookie(sid))
    return res.status(200).json({
      success: true,
      message: '',
      data: null,
    })
  }

  return res.status(405).json({
    success: false,
    message: 'Not allowed.',
    data: null,
  })
}

export default handler
