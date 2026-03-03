const mongoose = require('mongoose');

// Model for attendance tracking
const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeCode: String,
  employeeName: String,
  date: {
    type: Date,
    required: true
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'night', 'general']
  },
  checkIn: Date,
  checkOut: Date,
  workHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'leave', 'holiday', 'weekend'],
    default: 'absent'
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'earned', 'unpaid', 'maternity', 'paternity']
  },
  overtime: {
    type: Number,
    default: 0
  },
  lateArrival: {
    type: Boolean,
    default: false
  },
  earlyDeparture: {
    type: Boolean,
    default: false
  },
  remarks: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate work hours
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    this.workHours = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
    this.status = this.workHours >= 4 ? (this.workHours >= 8 ? 'present' : 'half_day') : 'absent';
  }
  next();
});

attendanceSchema.index({ employeeId: 1, date: -1 });
attendanceSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
