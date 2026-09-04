from bson import ObjectId
from pymongo.errors import DuplicateKeyError


class InsertOneResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class UpdateOneResult:
    def __init__(self, matched_count):
        self.matched_count = matched_count


class DeleteOneResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count


class FakeCollection:
    def __init__(self):
        self.documents = []
        self.unique_indexes = []

    def create_index(self, fields, unique=False):
        if unique:
            if isinstance(fields, str):
                self.unique_indexes.append((fields,))
            else:
                self.unique_indexes.append(tuple(field for field, _ in fields))

    def _matches(self, document, query):
        for key, value in query.items():
            if document.get(key) != value:
                return False
        return True

    def insert_one(self, payload):
        candidate = dict(payload)

        for index_fields in self.unique_indexes:
            for existing in self.documents:
                if all(existing.get(field) == candidate.get(field) for field in index_fields):
                    raise DuplicateKeyError("duplicate key")

        if "_id" not in candidate:
            candidate["_id"] = ObjectId()

        self.documents.append(candidate)
        return InsertOneResult(candidate["_id"])

    def find(self, query):
        return [dict(document) for document in self.documents if self._matches(document, query)]

    def find_one(self, query):
        for document in self.documents:
            if self._matches(document, query):
                return dict(document)
        return None

    def update_one(self, query, update):
        for index, document in enumerate(self.documents):
            if self._matches(document, query):
                if "$set" in update:
                    self.documents[index] = {**document, **update["$set"]}
                return UpdateOneResult(1)
        return UpdateOneResult(0)

    def delete_one(self, query):
        for index, document in enumerate(self.documents):
            if self._matches(document, query):
                self.documents.pop(index)
                return DeleteOneResult(1)
        return DeleteOneResult(0)

    def count_documents(self, query):
        return len(self.find(query))
