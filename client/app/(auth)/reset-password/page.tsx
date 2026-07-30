import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Khôi phục mật khẩu</h1>
      <p className="text-gray-500 mb-4">Trang này đang được xây dựng.</p>
      <Link href="/login" className="text-blue-600 hover:underline">
        Quay lại Đăng nhập
      </Link>
    </div>
  );
}
