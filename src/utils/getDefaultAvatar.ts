import {
  fatherAvatar,
  motherAvatar,
  sonAvatar,
  daughterAvatar,
  grandFatherAvatar,
  grandMotherAvatar
} from '@/assets/avatars';

/**
 * Lấy avatar mặc định dựa trên giới tính và độ tuổi
 * @param gender - 'MALE' hoặc 'FEMALE'
 * @param dateOfBirth - Ngày sinh (ISO string hoặc Date)
 * @returns URL của avatar mặc định
 */
export function getDefaultAvatar(gender: string, dateOfBirth?: string | Date): string {
  const isMale = gender === 'MALE';
  
  // Nếu không có ngày sinh, dùng avatar cha/mẹ
  if (!dateOfBirth) {
    return isMale ? fatherAvatar : motherAvatar;
  }

  // Tính tuổi
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Nam (MALE)
  if (isMale) {
    if (age < 13) {
      return sonAvatar; // Con trai
    } else if (age < 60) {
      return fatherAvatar; // Cha
    } else {
      return grandFatherAvatar; // Ông
    }
  }

  // Nữ (FEMALE)
  if (age < 13) {
    return daughterAvatar; // Con gái
  } else if (age < 60) {
    return motherAvatar; // Mẹ
  } else {
    return grandMotherAvatar; // Bà
  }
}
