import React from "react";

const DipositeSlip = () => {
	return (
		<div className="p-6">
			<table className="w-full table-fixed text-sm border-collapse">
				<tbody>
					<tr>
						<td className="w-1/4 border-2 border-black font-semibold align-middle">
							<img src="src/assets/tsl.png" alt="Logo" className="w-full h-full object-contain" />
						</td>

						<td className="w-1/2 border-2 font-extrabold border-black text-5xl text-center align-middle" colSpan={2}>
							DEPOSIT SLIP
						</td>

						<td className="w-1/4 border-2 border-black">
							<table className="w-full h-full table-fixed border-collapse">
								<tbody>
									<tr>
										<td className="w-1/2 border-r border-b border-black p-2 font-semibold">
											Vou Type
										</td>
										<td className="w-1/2 border-b border-black p-2">
											2.transactionType
										</td>
									</tr>

									<tr>
										<td className="border-r border-b border-black p-2 font-semibold">
											No
										</td>
										<td className="border-b border-black p-2">
											3.typeSerialNo
										</td>
									</tr>

									<tr>
										<td className="border-r border-black p-2 font-semibold">
											Date
										</td>
										<td className="p-2">
											Tran Date
										</td>
									</tr>
								</tbody>
							</table>
						</td>
					</tr>

					<tr>
						<td className="border-2 border-black font-bold align-top">
							Credited To Account
						</td>
						<td colSpan={2} className="border-2 border-black align-top">
							5.crAccountId + 5.crAccountId - Name
						</td>
						<td
							rowSpan={7}
							className="border-2 border-black align-top font-semibold"
						>
							For TSL
							<br />
							<br />
							<br />
							<br />
							<br />
							<br />
							<span className="font-normal opacity-50 text-center block mt-4">
								Seal and Signature Reguired <br />Here
							</span>
							<br />
							<br />
							<br />
							<br />
							<span className="block mb-0 text-center">Hemang Baldha</span>
						</td>
					</tr>

					<tr>
						<td className="border-2 border-black font-bold align-top">
							Membership
						</td>
						<td colSpan={2} className="border-2 border-black align-top">
							7.crMsNo + 4.crEntityId - Type + Name
						</td>
					</tr>

					<tr>
						<td className="border-2 border-black font-bold align-top">
							Member
						</td>
						<td colSpan={2} className="border-2 border-black align-top">
							6.crMemberId + 6.crMemberId - Name
						</td>
					</tr>

					<tr>
						<td className="border-2 border-black font-bold align-top">
							Received From
						</td>
						<td colSpan={2} className="border-2 border-black align-top">
							{"<Transaction Hase Name and Mobile>           an Amount Of Rs."}
						</td>
					</tr>

					<tr>
						<td colSpan={3} className="border-2 border-black font-semibold align-top">
							(In Words)
						</td>
					</tr>

					<tr>
						<td colSpan={3} className="border-2 border-black p-0">
							<table className="w-full border-collapse">
								<tbody>
									<tr>
										<td className="w-1/2 border-r border-black">
											By - 9.drAccountId - Name
										</td>
										<td className="w-1/2">
											Tran Ref No - 12.transactionDetails
										</td>
									</tr>
								</tbody>
							</table>
						</td>
					</tr>

					<tr>
						<td colSpan={3} className="border-2 border-black align-top">
							"Remarks : " + 19.printRemarks
						</td>
					</tr>

					<tr>
						<td className="border-2 border-black w-1/4 align-top">
							Source - 13.entrySource
						</td>
						<td className="border-2 border-black w-1/4 align-top">
							Ref No - 15.formReferenceNo
						</td>
						<td className="border-2 border-black w-1/4 align-top">
							EnrID - 14.enrollmentId
						</td>
						<td className="border-2 border-black w-1/4 align-top">
							Created + 21.createdAt
						</td>
					</tr>

					<tr>
						<td
							rowSpan={3}
							colSpan={3}
							className="border-2 border-black p-2 align-top text-xs leading-relaxed"
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
							className="p-2 border-r-2 border-b-2 border-black h-40 font-bold text-sm flex flex-col justify-between"
						>
							<span>Depositer's Sign</span>
							<span>Accept Terms and Conditions</span>
						</td>
					</tr>

				</tbody>
			</table>
		</div>
	);
};

export default DipositeSlip;