import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#F2F4F7]">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-[20px] font-medium text-[#1A202C] mb-1">Segura Pay</h1>
          <p className="text-[14px] text-[#4A5568]">Compra e venda segura via Pix + WhatsApp</p>
        </div>

        <div className="bg-white rounded-[16px] border border-[#E4E8F0] p-6 mb-4 text-left">
          <h2 className="text-[15px] font-medium text-[#1A202C] mb-4">Como funciona</h2>
          <ol className="space-y-3">
            <li className="flex gap-3 text-[14px]">
              <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#1338CC] flex items-center justify-center font-medium text-xs flex-shrink-0 mt-0.5">1</span>
              <span className="text-[#4A5568]">Vendedor gera um link de pagamento</span>
            </li>
            <li className="flex gap-3 text-[14px]">
              <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#1338CC] flex items-center justify-center font-medium text-xs flex-shrink-0 mt-0.5">2</span>
              <span className="text-[#4A5568]">Comprador paga via Pix — dinheiro fica retido no Segura Pay</span>
            </li>
            <li className="flex gap-3 text-[14px]">
              <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#1338CC] flex items-center justify-center font-medium text-xs flex-shrink-0 mt-0.5">3</span>
              <span className="text-[#4A5568]">Vendedor entrega o produto</span>
            </li>
            <li className="flex gap-3 text-[14px]">
              <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#1338CC] flex items-center justify-center font-medium text-xs flex-shrink-0 mt-0.5">4</span>
              <span className="text-[#4A5568]">Comprador confirma o recebimento</span>
            </li>
            <li className="flex gap-3 text-[14px]">
              <span className="w-6 h-6 rounded-full bg-[#ECFDF5] text-[#047857] flex items-center justify-center font-medium text-xs flex-shrink-0 mt-0.5">5</span>
              <span className="text-[#4A5568]">Dinheiro liberado para o vendedor</span>
            </li>
          </ol>
        </div>

        <Link
          href="/nova-transacao"
          className="w-full block bg-[#1B4DFF] hover:bg-[#1338CC] text-white font-medium py-2.5 px-5 rounded-[10px] transition-all duration-150 active:scale-[0.98] text-[14px] text-center"
        >
          Criar transação segura
        </Link>

        <p className="mt-4 text-[12px] text-[#8890A4]">
          Já tem um link de pagamento? Acesse o link enviado pelo vendedor.
        </p>
      </div>
    </div>
  );
}
