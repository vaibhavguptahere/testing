import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import AccessLog from '@/models/AccessLog';

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;

    if (user.role !== 'patient') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get total records count
    const totalRecords = await MedicalRecord.countDocuments({ patientId: user._id });

    // Get unique doctors with access
    const recordsWithAccess = await MedicalRecord.find({ patientId: user._id })
      .populate('accessPermissions.doctorId', 'profile.firstName profile.lastName');
    
    const uniqueDoctors = new Set();
    recordsWithAccess.forEach(record => {
      record.accessPermissions.forEach(access => {
        if (access.granted && access.doctorId) {
          uniqueDoctors.add(access.doctorId._id.toString());
        }
      });
    });

    // Get recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentActivity = await AccessLog.countDocuments({
      patientId: user._id,
      timestamp: { $gte: weekAgo }
    });

    // Calculate storage used (mock calculation)
    const storageUsed = Math.min(Math.round((totalRecords / 100) * 100), 100);

    return Response.json({
      totalRecords,
      sharedDoctors: uniqueDoctors.size,
      recentActivity,
      storageUsed,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}