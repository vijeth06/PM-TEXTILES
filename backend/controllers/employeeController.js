const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Create employee
// @route   POST /api/hr/employees
// @access  Private (Admin, HR)
exports.createEmployee = asyncHandler(async (req, res) => {
  // Generate employee code
  const count = await Employee.countDocuments();
  const employeeCode = `EMP-${String(count + 1).padStart(5, '0')}`;

  const employee = await Employee.create({
    ...req.body,
    employeeCode
  });

  res.status(201).json({
    success: true,
    data: employee
  });
});

// @desc    Get all employees
// @route   GET /api/hr/employees
// @access  Private
exports.getEmployees = asyncHandler(async (req, res) => {
  const { department, isActive, designation } = req.query;
  
  let query = {};
  if (department) query['employmentDetails.department'] = department;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (designation) query['employmentDetails.designation'] = designation;

  const employees = await Employee.find(query)
    .populate('employmentDetails.reportingTo', 'employeeCode personalInfo.firstName personalInfo.lastName')
    .populate('userId', 'username email')
    .sort({ employeeCode: 1 });

  res.json({
    success: true,
    count: employees.length,
    data: employees
  });
});

// @desc    Get single employee
// @route   GET /api/hr/employees/:id
// @access  Private
exports.getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate('employmentDetails.reportingTo')
    .populate('userId');

  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  res.json({
    success: true,
    data: employee
  });
});

// @desc    Update employee
// @route   PUT /api/hr/employees/:id
// @access  Private (Admin, HR)
exports.updateEmployee = asyncHandler(async (req, res) => {
  let employee = await Employee.findById(req.params.id);

  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    data: employee
  });
});

// @desc    Mark employee attendance
// @route   POST /api/hr/employees/:id/attendance
// @access  Private
exports.markAttendance = asyncHandler(async (req, res) => {
  const { date, checkIn, checkOut, status, shift } = req.body;

  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  // Check if attendance already marked for this date
  const existingAttendance = await Attendance.findOne({
    employeeId: req.params.id,
    date: new Date(date)
  });

  if (existingAttendance) {
    res.status(400);
    throw new Error('Attendance already marked for this date');
  }

  const attendance = await Attendance.create({
    employeeId: req.params.id,
    employeeCode: employee.employeeCode,
    employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
    date,
    shift,
    checkIn: checkIn ? new Date(checkIn) : null,
    checkOut: checkOut ? new Date(checkOut) : null,
    status
  });

  // Update employee attendance summary
  if (status === 'present') {
    employee.attendance.totalPresent += 1;
    employee.attendance.currentMonthPresent += 1;
  } else if (status === 'absent') {
    employee.attendance.totalAbsent += 1;
  } else if (status === 'leave') {
    employee.attendance.totalLeave += 1;
  }

  await employee.save();

  res.status(201).json({
    success: true,
    data: attendance
  });
});

// @desc    Get employee attendance
// @route   GET /api/hr/employees/:id/attendance
// @access  Private
exports.getEmployeeAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let query = { employeeId: req.params.id };

  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const attendance = await Attendance.find(query).sort({ date: -1 });

  // Calculate statistics
  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    halfDay: attendance.filter(a => a.status === 'half_day').length,
    leave: attendance.filter(a => a.status === 'leave').length,
    totalWorkHours: attendance.reduce((sum, a) => sum + (a.workHours || 0), 0)
  };

  res.json({
    success: true,
    count: attendance.length,
    data: attendance,
    stats
  });
});

// @desc    Add employee training
// @route   POST /api/hr/employees/:id/training
// @access  Private (Admin, HR)
exports.addTraining = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  employee.training.push(req.body);
  await employee.save();

  res.json({
    success: true,
    data: employee
  });
});

// @desc    Add employee skill/certification
// @route   POST /api/hr/employees/:id/skills
// @access  Private (Admin, HR)
exports.addSkill = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  if (req.body.type === 'skill') {
    employee.skills.push(req.body);
  } else if (req.body.type === 'certification') {
    employee.certifications.push(req.body);
  }

  await employee.save();

  res.json({
    success: true,
    data: employee
  });
});

// @desc    Terminate employee
// @route   PUT /api/hr/employees/:id/terminate
// @access  Private (Admin)
exports.terminateEmployee = asyncHandler(async (req, res) => {
  const { terminationDate, terminationReason } = req.body;

  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  employee.isActive = false;
  employee.terminationDate = terminationDate;
  employee.terminationReason = terminationReason;

  await employee.save();

  res.json({
    success: true,
    message: 'Employee terminated successfully',
    data: employee
  });
});

// @desc    Delete employee
// @route   DELETE /api/hr/employees/:id
// @access  Private (Admin)
exports.deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  await employee.deleteOne();

  res.json({
    success: true,
    message: 'Employee deleted successfully'
  });
});
