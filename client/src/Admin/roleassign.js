export default function roleassign(){
    <li key={user.id} className="user-item">
                        <div>
                            <strong>{user.name}</strong> ({user.email})
                        </div>
                        <div>
                            <button onClick={() => assignRole(user.id, 'Author')}>Assign Author</button>
                            <button onClick={() => assignRole(user.id, 'Chair')}>Assign Chair</button>
                            <button onClick={() => assignRole(user.id, 'Reviewer')}>Assign Reviewer</button>
                            </div>
                    </li>
}