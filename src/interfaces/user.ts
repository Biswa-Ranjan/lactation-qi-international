/**
 * This interface is going to keep all the attributes of a patient
 * @author Jagat Bandhu
 * @since 0.0.1
 */
interface IUser{
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    state: string;
    institution: string;
    district: string;
    syncFailureMessage: string;
    isSynced: boolean;
    createdDate: string;
    updatedDate: string;
    uuidNumber: string;
}
