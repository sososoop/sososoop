// 관리자 테스트 주문 — 토스 결제창 없이 결제 완료 화면까지 가서 쿠폰 사용·주문 기록·선물 받기를 확인한다.
// 결제 완료 화면은 이 paymentKey를 관리자 세션일 때만 받아 주고, 토스 승인 호출을 건너뛴다.
// 주문은 금액 0원·주문명 앞에 표시를 붙여 기록해 매출에 섞이지 않게 한다.
export const ADMIN_TEST_PAYMENT_KEY = 'ADMIN_TEST';
export const ADMIN_TEST_ORDER_PREFIX = '[관리자 테스트] ';
