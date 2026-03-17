import { toast } from 'react-toastify';

export interface ValidationError {
  field: string;
  message: string;
}

// Validation rules dựa trên API specification
export const validationRules = {
  // Address validation
  address: {
    formattedAddress: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Địa chỉ định dạng không được để trống';
      }
      if (value.length > 500) {
        return 'Địa chỉ định dạng không được vượt quá 500 ký tự';
      }
      return null;
    },
    addressLine: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Đường/phố không được để trống';
      }
      if (value.length > 200) {
        return 'Đường/phố không được vượt quá 200 ký tự';
      }
      return null;
    },
    ward: (value?: string) => {
      if (value && value.length > 100) {
        return 'Phường/xã không được vượt quá 100 ký tự';
      }
      return null;
    },
    district: (value?: string) => {
      if (value && value.length > 100) {
        return 'Quận/huyện không được vượt quá 100 ký tự';
      }
      return null;
    },
    city: (value?: string) => {
      if (value && value.length > 100) {
        return 'Thành phố không được vượt quá 100 ký tự';
      }
      return null;
    },
    province: (value?: string) => {
      if (value && value.length > 100) {
        return 'Tỉnh không được vượt quá 100 ký tự';
      }
      return null;
    },
    country: (value?: string) => {
      if (value && value.length > 100) {
        return 'Quốc gia không được vượt quá 100 ký tự';
      }
      return null;
    },
    latitude: (value?: number) => {
      if (value !== undefined && (value < -90 || value > 90)) {
        return 'Vĩ độ phải nằm trong khoảng từ -90 đến 90';
      }
      return null;
    },
    longitude: (value?: number) => {
      if (value !== undefined && (value < -180 || value > 180)) {
        return 'Kinh độ phải nằm trong khoảng từ -180 đến 180';
      }
      return null;
    },
    fromDate: (value?: string | Date) => {
      if (!value) {
        return 'Ngày bắt đầu không được để trống';
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Ngày bắt đầu không hợp lệ';
      }
      return null;
    },
    toDate: (value?: string | Date) => {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Ngày kết thúc không hợp lệ';
        }
      }
      return null;
    }
  },

  // Tree validation
  tree: {
    name: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Tên cây gia phả không được để trống';
      }
      if (value.length < 2) {
        return 'Tên cây gia phả phải có ít nhất 2 ký tự';
      }
      if (value.length > 255) {
        return 'Tên cây gia phả không được vượt quá 255 ký tự';
      }
      return null;
    },
    description: (value?: string) => {
      if (value && value.length > 1000) {
        return 'Mô tả không được vượt quá 1000 ký tự';
      }
      return null;
    }
  },

  // Person validation
  person: {
    firstName: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Tên không được để trống';
      }
      if (value.length < 2) {
        return 'Tên phải có ít nhất 2 ký tự';
      }
      if (value.length > 100) {
        return 'Tên không được vượt quá 100 ký tự';
      }
      return null;
    },
    lastName: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Họ không được để trống';
      }
      if (value.length < 2) {
        return 'Họ phải có ít nhất 2 ký tự';
      }
      if (value.length > 100) {
        return 'Họ không được vượt quá 100 ký tự';
      }
      return null;
    },
    gender: (value: string) => {
      if (!value) {
        return 'Giới tính không được để trống';
      }
      if (!['MALE', 'FEMALE'].includes(value)) {
        return 'Giới tính không hợp lệ';
      }
      return null;
    },
    dateOfBirth: (value?: string | Date) => {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Ngày sinh không hợp lệ';
        }
        if (date > new Date()) {
          return 'Ngày sinh không thể lớn hơn ngày hôm nay';
        }
      }
      return null;
    },
    dateOfDeath: (value?: string | Date, dateOfBirth?: string | Date) => {
      if (value) {
        const deathDate = new Date(value);
        if (isNaN(deathDate.getTime())) {
          return 'Ngày mất không hợp lệ';
        }
        if (deathDate > new Date()) {
          return 'Ngày mất không thể lớn hơn ngày hôm nay';
        }
        if (dateOfBirth) {
          const birthDate = new Date(dateOfBirth);
          if (deathDate < birthDate) {
            return 'Ngày mất không thể nhỏ hơn ngày sinh';
          }
        }
      }
      return null;
    },
    citizenIdentificationNumber: (value?: string) => {
      if (value) {
        if (!/^\d{9}$|^\d{12}$/.test(value)) {
          return 'Số căn cước/CMND phải là 9 hoặc 12 chữ số';
        }
      }
      return null;
    }
  },

  // Event validation
  event: {
    name: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Tên sự kiện không được để trống';
      }
      if (value.length < 2) {
        return 'Tên sự kiện phải có ít nhất 2 ký tự';
      }
      if (value.length > 255) {
        return 'Tên sự kiện không được vượt quá 255 ký tự';
      }
      return null;
    },
    description: (value?: string) => {
      if (value && value.length > 1000) {
        return 'Mô tả sự kiện không được vượt quá 1000 ký tự';
      }
      return null;
    },
    startedAt: (value?: string | Date) => {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Ngày bắt đầu sự kiện không hợp lệ';
        }
      }
      return null;
    },
    endedAt: (value?: string | Date, startedAt?: string | Date) => {
      if (value) {
        const endDate = new Date(value);
        if (isNaN(endDate.getTime())) {
          return 'Ngày kết thúc sự kiện không hợp lệ';
        }
        if (startedAt) {
          const startDate = new Date(startedAt);
          if (endDate < startDate) {
            return 'Ngày kết thúc không thể nhỏ hơn ngày bắt đầu';
          }
        }
      }
      return null;
    }
  },

  // Authentication validation
  auth: {
    userName: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Tên đăng nhập không được để trống';
      }
      if (value.length < 3) {
        return 'Tên đăng nhập phải có ít nhất 3 ký tự';
      }
      if (value.length > 50) {
        return 'Tên đăng nhập không được vượt quá 50 ký tự';
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
        return 'Tên đăng nhập chỉ chứa chữ, số, dấu gạch dưới, dấu chấm và dấu gạch ngang';
      }
      return null;
    },
    email: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Email không được để trống';
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Email không hợp lệ';
      }
      return null;
    },
    password: (value: string) => {
      if (!value) {
        return 'Mật khẩu không được để trống';
      }
      if (value.length < 6) {
        return 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      if (value.length > 100) {
        return 'Mật khẩu không được vượt quá 100 ký tự';
      }
      return null;
    },
    confirmPassword: (value: string, password?: string) => {
      if (!value) {
        return 'Xác nhận mật khẩu không được để trống';
      }
      if (value !== password) {
        return 'Xác nhận mật khẩu không trùng khớp';
      }
      return null;
    },
    phoneNumber: (value?: string) => {
      if (value) {
        if (!/^\d{10,15}$/.test(value.replace(/^\+/, ''))) {
          return 'Số điện thoại không hợp lệ (10-15 chữ số)';
        }
      }
      return null;
    }
  },

  // User validation
  user: {
    firstName: (value?: string) => {
      if (value && value.length > 100) {
        return 'Tên không được vượt quá 100 ký tự';
      }
      return null;
    },
    lastName: (value?: string) => {
      if (value && value.length > 100) {
        return 'Họ không được vượt quá 100 ký tự';
      }
      return null;
    },
    phoneNumber: (value?: string) => {
      if (value) {
        if (!/^\d{10,15}$/.test(value.replace(/^\+/, ''))) {
          return 'Số điện thoại không hợp lệ (10-15 chữ số)';
        }
      }
      return null;
    },
    dateOfBirth: (value?: string | Date) => {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Ngày sinh không hợp lệ';
        }
        if (date > new Date()) {
          return 'Ngày sinh không thể lớn hơn ngày hôm nay';
        }
      }
      return null;
    }
  },

  // Invitation validation
  invitation: {
    email: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Email không được để trống';
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Email không hợp lệ';
      }
      return null;
    },
    role: (value: string) => {
      if (!value) {
        return 'Vai trò không được để trống';
      }
      if (!['VIEWER', 'EDITOR', 'ADMIN', 'OWNER'].includes(value)) {
        return 'Vai trò không hợp lệ';
      }
      return null;
    }
  },

  // Media validation
  media: {
    file: (file: File | null) => {
      if (!file) {
        return 'Tệp không được để trống';
      }
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return 'Kích thước tệp không được vượt quá 50MB';
      }
      return null;
    },
    mediaFileTypeId: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Loại tệp media không được để trống';
      }
      return null;
    }
  }
};

// Hàm validate một field
export const validateField = (
  category: keyof typeof validationRules,
  field: string,
  value: any,
  additionalValue?: any
): string | null => {
  const rules = validationRules[category] as any;
  const validator = rules?.[field];

  if (!validator) {
    return null;
  }

  if (additionalValue !== undefined) {
    return validator(value, additionalValue);
  }

  return validator(value);
};

// Hàm validate toàn bộ object
export const validateObject = (
  category: keyof typeof validationRules,
  data: Record<string, any>
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const rules = validationRules[category] as any;

  Object.keys(rules).forEach((field) => {
    const validator = rules[field];
    const error = validator(data[field], data);
    if (error) {
      errors.push({
        field,
        message: error
      });
    }
  });

  return errors;
};

// Hàm chỉ show error toast
export const showErrorToast = (message: string) => {
  toast.error(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });
};

// Hàm chỉ show success toast
export const showSuccessToast = (message: string) => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });
};

// Hàm chỉ show info toast
export const showInfoToast = (message: string) => {
  toast.info(message, {
    position: 'top-right',
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });
};

// Hàm chỉ show warning toast
export const showWarningToast = (message: string) => {
  toast.warning(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });
};

// Hàm validate và show errors
export const validateAndShowErrors = (
  category: keyof typeof validationRules,
  data: Record<string, any>
): boolean => {
  const errors = validateObject(category, data);

  if (errors.length > 0) {
    errors.forEach((error) => {
      showErrorToast(error.message);
    });
    return false;
  }

  return true;
};
