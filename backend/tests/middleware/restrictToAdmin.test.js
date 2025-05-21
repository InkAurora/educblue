const restrictToAdmin = require('../../middleware/restrictToAdmin');

describe('Restrict to Admin Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Set up mock request, response, and next function
    req = {
      user: {
        id: 'user-id',
        role: 'student',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  it('should call next if user is an admin', () => {
    req.user.role = 'admin';
    restrictToAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 403 if user is not an admin', () => {
    req.user.role = 'student';
    restrictToAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Access denied'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not authenticated', () => {
    req.user = null;
    restrictToAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Unauthorized'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
