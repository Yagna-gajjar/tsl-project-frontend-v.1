import { useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Transaction } from "@/types/transaction";

const CustomTable = ({ printRow }: { printRow: Transaction | undefined }) => {
	const tableRef = useRef(null);

	const downloadPDF = async () => {
		const element = tableRef.current;

		const canvas = await html2canvas(element as any, {
			scale: 2,
			useCORS: true,
			backgroundColor: "#ffffff"
		});

		const imgData = canvas.toDataURL("image/png");
		const pdf = new jsPDF("p", "mm", "a4");

		const pageWidth = pdf.internal.pageSize.getWidth();

		const margin = 10;
		const usableWidth = pageWidth - margin * 2;
		const imgHeight = (canvas.height * usableWidth) / canvas.width;

		pdf.addImage(imgData, "PNG", margin, margin, usableWidth, imgHeight);
		pdf.save("DepositSlip.pdf");

	};
	useEffect(() => {
		console.log(printRow, " : print row");
	}, [printRow])

	return (
		printRow && <div id="depositSlip" className="p-6 bg-gray-100 min-h-screen">
			<button
				onClick={downloadPDF}
				className="mb-6 px-6 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800"
			>
				Download PDF
			</button>

			<div ref={tableRef} className="bg-white p-4">
				<table className="w-full table-fixed text-sm border-collapse">
					<tbody>
						<tr>
							<td className="w-1/4 border-2 border-black font-semibold align-middle p-2">
								<img
									src="src/assets/tsl.png"
									alt="Logo"
									className="w-full h-20 object-contain"
								/>
							</td>

							<td
								className="w-1/2 border-2 font-extrabold border-black text-4xl text-center align-middle p-2"
								colSpan={2}
							>
								DEPOSIT SLIP
							</td>

							<td className="w-1/4 border-2 border-black p-0">
								<table className="w-full h-full table-fixed border-collapse">
									<tbody>
										<tr>
											<td className="w-1/2 border-r border-b border-black p-2 font-semibold align-middle">
												Vou Type
											</td>
											<td className="w-1/2 border-b border-black p-2 align-middle">
												{printRow?.transactionType}
											</td>
										</tr>

										<tr>
											<td className="border-r border-b border-black p-2 font-semibold align-middle">
												No
											</td>
											<td className="border-b border-black p-2 align-middle">
												3.typeSerialNo
											</td>
										</tr>

										<tr>
											<td className="border-r border-black p-2 font-semibold align-middle">
												Date
											</td>
											<td className="p-2 align-middle">
												Tran Date
											</td>
										</tr>
									</tbody>
								</table>
							</td>
						</tr>

						<tr>
							<td className="border-2 border-black font-bold align-top p-2">
								Credited To Account
							</td>
							<td colSpan={2} className="border-2 border-black align-top p-2">
								{printRow?.crAccountId} {printRow?.crAccountName}
							</td>
							<td
								rowSpan={7}
								className="border-2 border-black align-top font-semibold p-2"
							>
								<div className="flex flex-col justify-between h-full min-h-[300px]">
									<div className="text-center">For TSL</div>

									<div className="text-center text-xs opacity-60">
										Seal and Signature Reguired <br />Here
									</div>

									<div className="text-center">Hemang Baldha</div>
								</div>
							</td>
						</tr>

						<tr>
							<td className="border-2 border-black font-bold align-top p-2">
								Membership
							</td>
							<td colSpan={2} className="border-2 border-black align-top p-2">
								7.crMsNo + 4.crEntityId - Type + Name
							</td>
						</tr>

						<tr>
							<td className="border-2 border-black font-bold align-top p-2">
								Member
							</td>
							<td colSpan={2} className="border-2 border-black align-top p-2">
								6.crMemberId + 6.crMemberId - Name
							</td>
						</tr>

						<tr>
							<td className="border-2 border-black font-bold align-top p-2">
								Received From
							</td>
							<td colSpan={2} className="border-2 border-black align-top p-2">
								{"<Transaction Hase Name and Mobile>           an Amount Of Rs."}
							</td>
						</tr>

						<tr>
							<td colSpan={3} className="border-2 border-black font-semibold align-top p-2">
								(In Words)
							</td>
						</tr>

						<tr>
							<td colSpan={3} className="border-2 border-black p-0">
								<table className="w-full border-collapse">
									<tbody>
										<tr>
											<td className="w-1/2 border-r border-black p-2 align-middle">
												By - 9.drAccountId - Name
											</td>
											<td className="w-1/2 p-2 align-middle">
												Tran Ref No - 12.transactionDetails
											</td>
										</tr>
									</tbody>
								</table>
							</td>
						</tr>

						<tr>
							<td colSpan={3} className="border-2 border-black align-top p-2">
								Remarks : {printRow?.printRemarks}
							</td>
						</tr>

						<tr>
							<td className="border-2 border-black w-1/4 align-middle text-center p-2">
								Source - 13.entrySource
							</td>
							<td className="border-2 border-black w-1/4 align-middle text-center p-2">
								Ref No - 15.formReferenceNo
							</td>
							<td className="border-2 border-black w-1/4 align-middle text-center p-2">
								EnrID - 14.enrollmentId
							</td>
							<td className="border-2 border-black w-1/4 align-middle text-center p-2">
								Created + 21.createdAt
							</td>
						</tr>

						<tr>
							<td
								rowSpan={3}
								colSpan={3}
								className="border-2 border-black p-3 align-top text-xs leading-relaxed"
							>
								Terms & Conditions : 1) Jurisdiction Rajkot. 2) This Payment is collected on Behalf of the RSCA (Registered Sports Coaching
								Academies) of TSL. 3) The Payment is a Non Refundable Deposit which shall be used to pay the Enrolment Fees of RSCA debited to
								your Account. 3) Cheque / Online Payment subject to realization / successful transfer. 4) The Amount being Deposited has to be
								utilized by you before the Expiry Date as Mentioned on this Slip, any amount that is not utilized before the Expiry Date shall be
								Debited as "Connivence Charges" to your Account. 5) Please utilize this amount and Get Enrolment Slip before the Expiry Date. 6)
								This Amount cannot be transferred to any other account. 6) You have read our Policy Document and Agree to all the Terms &
								Conditions.
							</td>

							<td
								rowSpan={3}
								className="p-3 border-r-2 h-40 border-b-2 border-black font-bold text-sm flex flex-col justify-between"
							>
								<span>Depositer's Sign</span>
								<span>Accept Terms and Conditions</span>
							</td>
						</tr>

					</tbody>
				</table>
			</div>
		</div>
	);
};

export default CustomTable;