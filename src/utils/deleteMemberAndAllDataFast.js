import { 
  getFirestore, doc, deleteDoc, collection, getDocs, query, where, writeBatch 
} from 'firebase/firestore';

const db = getFirestore();

/**
 * সম্পূর্ণ member ও তার সব data (meals, expenses, deposits, bazar) দ্রুত ডিলিট করার function
 * @param {string} memberId - Member doc-এর Firestore ID
 * @param {string} memberName - Member-এর নাম (deposits, bazar এ দরকার হয়)
 */
export async function deleteMemberAndAllDataFast(memberId, memberName) {
  // 1. Member Document ডিলিট
  await deleteDoc(doc(db, 'members', memberId));

  // 2. Meals থেকে memberId ডিলিট (property remove, not whole doc!)
  const mealSnap = await getDocs(collection(db, 'meals'));
  const mealBatch = writeBatch(db);
  mealSnap.forEach((d) => {
    const mealsObj = d.data().meals || {};
    if (mealsObj[memberId]) {
      let newMeals = { ...mealsObj };
      delete newMeals[memberId];
      mealBatch.update(doc(db, 'meals', d.id), { meals: newMeals });
    }
  });
  await mealBatch.commit();

  // 3. Expenses (payerId === memberId)
  const expenseQuery = query(collection(db, 'expenses'), where('payerId', '==', memberId));
  const expenseSnap = await getDocs(expenseQuery);
  if (!expenseSnap.empty) {
    const expenseBatch = writeBatch(db);
    expenseSnap.forEach((d) => {
      expenseBatch.delete(doc(db, 'expenses', d.id));
    });
    await expenseBatch.commit();
  }

  // 4. Deposits (member === memberName)
  const depositQuery = query(collection(db, 'deposits'), where('member', '==', memberName));
  const depositSnap = await getDocs(depositQuery);
  if (!depositSnap.empty) {
    const depositBatch = writeBatch(db);
    depositSnap.forEach((d) => {
      depositBatch.delete(doc(db, 'deposits', d.id));
    });
    await depositBatch.commit();
  }

  // 5. Bazar (person === memberName)
  const bazarQuery = query(collection(db, 'bazar'), where('person', '==', memberName));
  const bazarSnap = await getDocs(bazarQuery);
  if (!bazarSnap.empty) {
    const bazarBatch = writeBatch(db);
    bazarSnap.forEach((d) => {
      bazarBatch.delete(doc(db, 'bazar', d.id));
    });
    await bazarBatch.commit();
  }
}